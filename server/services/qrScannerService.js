const axios = require('axios');
const { Jimp } = require('jimp');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');

const ALIENVAULT_OTX_KEY = process.env.ALIENVAULT_OTX_KEY;

/**
 * Decode QR Code from Base64 Image String
 * @param {string} base64Image 
 * @returns {Promise<string>} Decoded URL or text
 */
const decodeQR = async (base64Image) => {
    try {
        //Robust Base64 cleaning: Safe split to handle any data:image/ type
        const rawBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        const buffer = Buffer.from(rawBase64, 'base64');

        console.log(`[DEBUG] Buffer size: ${buffer.length}`);

        if (!Jimp) console.error('[DEBUG] Jimp is UNDEFINED');

        let image = null;
        let width, height, data;

        try {
            image = await Jimp.read(buffer);
            console.log('[DEBUG] Jimp read successful');

            if (image.bitmap.width > 800) {
                const autoH = (Jimp.AUTO) ? Jimp.AUTO : -1;
                image.resize(800, autoH);
            }
            width = image.bitmap.width;
            height = image.bitmap.height;
            data = image.bitmap.data;
        } catch (jimpErr) {
            console.warn('[DEBUG] Jimp failed, trying PNGJS fallback:', jimpErr.message);
            try {
                const pngData = await new Promise((resolve, reject) => {
                    new PNG().parse(buffer, (err, res) => {
                        if (err) reject(err);
                        else resolve(res);
                    });
                });
                width = pngData.width;
                height = pngData.height;
                data = pngData.data;
                console.log('[DEBUG] PNGJS parse successful');
            } catch (pngErr) {
                throw new Error(`Both Jimp and PNGJS failed to decode image. Jimp: ${jimpErr.message}`);
            }
        }

        const clampedData = new Uint8ClampedArray(data);
        const code = jsQR(clampedData, width, height);

        if (code) {
            console.log('QR Code Decoded:', code.data);
            return code.data;
        } else {
            // Retry only if we have a Jimp image object to manipulate
            if (image) {
                image.greyscale().contrast(0.4);
                const processedData = new Uint8ClampedArray(image.bitmap.data);
                const retryCode = jsQR(processedData, image.bitmap.width, image.bitmap.height);

                if (retryCode) {
                    console.log('QR Code Decoded (Retry):', retryCode.data);
                    return retryCode.data;
                }
            }

            throw new Error('QR Code pattern not found in image.');
        }
    } catch (error) {
        console.error('QR Decode Error:', error.message);
        throw new Error('Failed to decode QR image: ' + error.message);
    }
};

/**
 * Scan URL using AlienVault OTX
 * @param {string} url 
 * @returns {Promise<Object>} Risk Report
 */
const scanURL = async (url) => {
    console.log(`[DEBUG] scanURL called with: '${url}'`);
    // 1. Sanitize & Basic Validation
    if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('192.168.')) {
        return {
            status: 'Clean',
            risk: 'Low',
            confidence: 100,
            threatType: 'Local/Internal',
            recommendation: 'Internal resource. Safe from external reputation checks.'
        };
    }

    try {
        let target = url;
        try {
            const parsed = new URL(url);
            target = parsed.hostname; // Fallback to hostname if needed
        } catch (e) {
            // Not a valid URL structure, check if it's just a domain
        }

        let endpoint = `https://otx.alienvault.com/api/v1/indicators/domain/${target}/general`;

        const response = await axios.get(endpoint, {
            headers: { 'X-OTX-API-KEY': ALIENVAULT_OTX_KEY }
        });

        const data = response.data;

        // Analyze Pulse Info
        const pulse_info = data.pulse_info || {};
        const pulses = pulse_info.count || 0;
        const references = pulse_info.references || [];

        // Determine Verdict
        let status = 'Clean';
        let riskScore = 0;
        let threatType = 'None';
        let confidence = 0;

        if (pulses > 0) {
            // Basic heuristic
            riskScore = Math.min(10, 3 + Math.floor(pulses / 5)); // Base 3, adds up
            status = 'Suspicious';
            confidence = 50 + (pulses * 2);

            if (pulses > 10) {
                status = 'Malicious';
                riskScore = 8 + Math.floor(pulses / 20);
                confidence = 90;
            }

            threatType = 'OTX_Flagged';
        }

        // Cap Score
        if (riskScore > 10) riskScore = 10;
        if (confidence > 100) confidence = 100;

        // Formulate Response
        return {
            url: url,
            status: status,
            risk: status === 'Malicious' ? 'High' : status === 'Suspicious' ? 'Medium' : 'Low',
            score: riskScore,
            confidence: confidence,
            threatType: threatType,
            source: 'AlienVault OTX',
            pulses: pulses,
            campaign: references.length > 0 ? 'Multiple Campaigns Linked' : 'None',
            safeToOpen: status === 'Clean',
            recommendation: status === 'Clean' ? 'Safe to open, but always verify source.' : 'Do NOT open this link.'
        };

    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Domain not found in OTX => Unknown but likely clean or new
            return {
                url: url,
                status: 'Unknown',
                risk: 'Low',
                score: 0,
                confidence: 10,
                threatType: 'None',
                source: 'AlienVault OTX',
                pulses: 0,
                safeToOpen: true,
                recommendation: 'No threat intelligence found. Proceed with caution.'
            };
        }

        if (error.response && error.response.status === 400) {
            // Bad Request => content is likely not a valid domain/IP for OTX
            return {
                url: url,
                status: 'Unknown',
                risk: 'Low',
                score: 0,
                confidence: 0,
                threatType: 'None',
                source: 'AlienVault OTX',
                pulses: 0,
                safeToOpen: true,
                recommendation: 'Input is not a valid domain for threat analysis. Proceed with caution.'
            };
        }

        console.error('OTX Scan Error Details:', error.response ? error.response.data : error.message);
        console.error('OTX Scan Error:', error.message);
        throw new Error('Threat Intelligence Gateway Failed');
    }
};

module.exports = {
    decodeQR,
    scanURL
};
