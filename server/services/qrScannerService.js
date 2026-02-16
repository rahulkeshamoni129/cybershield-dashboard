const axios = require('axios');
const Jimp = require('jimp'); // Changed from destructuring to default import
const jsQR = require('jsqr');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

const ALIENVAULT_OTX_KEY = process.env.ALIENVAULT_OTX_KEY;

/**
 * Decode QR Code from Base64 Image String
 * @param {string} base64Image 
 * @returns {Promise<string>} Decoded URL or text
 */
const decodeQR = async (base64Image) => {
    try {
        // Robust Base64 cleaning
        const rawBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        const buffer = Buffer.from(rawBase64, 'base64');

        console.log(`[DEBUG] Image Buffer Size: ${buffer.length} bytes`);

        // Helper: Attempt to scan a buffer
        const scanBuffer = (data, width, height) => {
            const clamped = new Uint8ClampedArray(data);
            return jsQR(clamped, width, height);
        };

        // Helper: Convert Jimp image to proper format for jsQR
        const scanJimpImage = (image) => {
            return scanBuffer(image.bitmap.data, image.bitmap.width, image.bitmap.height);
        };

        // 1. Try Primary Method: Jimp (Handles PNG/JPG/BMP/etc + Preprocessing)
        try {
            const image = await Jimp.read(buffer);

            // Optimization: Resize massive images to prevent blocking
            if (image.bitmap.width > 1200) {
                const scale = 1200 / image.bitmap.width;
                image.resize(1200, Math.round(image.bitmap.height * scale));
            }

            // Attempt 1: Raw scan
            let code = scanJimpImage(image);
            if (code) return code.data;

            // Attempt 2: Normalization & Contrast
            // Commonly fixes slightly washed out or dark QR codes
            image.normalize().contrast(0.6);
            code = scanJimpImage(image);
            if (code) return code.data;

            // Attempt 3: Greyscale + Heavy Contrast (Binarization-like)
            image.greyscale().contrast(0.9);
            code = scanJimpImage(image);
            if (code) return code.data;

            // Attempt 4: Invert (Some QR codes are white on black)
            image.invert();
            code = scanJimpImage(image);
            if (code) return code.data;

        } catch (jimpError) {
            console.warn(`[WARN] Jimp failed to process image: ${jimpError.message}. Trying fallbacks...`);
        }

        // 2. Fallback Method: Specific Libraries (PNGJS / JPEG-JS)
        // Useful if Jimp fails on specific compression types or headers
        try {
            // Check for PNG signature
            if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
                const pngData = PNG.sync.read(buffer);
                const code = scanBuffer(pngData.data, pngData.width, pngData.height);
                if (code) return code.data;
            }
            // Check for JPEG signature (FF D8)
            else if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
                const jpegData = jpeg.decode(buffer, { useTArray: true }); // Returns { width, height, data }
                const code = scanBuffer(jpegData.data, jpegData.width, jpegData.height);
                if (code) return code.data;
            }
        } catch (fallbackError) {
            console.error(`[ERROR] Fallback decoders also failed: ${fallbackError.message}`);
        }

        throw new Error('QR Code could not be detected. Please ensure the image is clear and well-lit.');

    } catch (error) {
        console.error('QR Decode Workflow Error:', error.message);
        throw new Error(error.message);
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
