const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { decodeQR, scanURL } = require('../services/qrScannerService');



// @route   POST /api/qr/scan
// @desc    Securely scan a QR coce or URL
// @access  Private
router.post('/scan', protect, async (req, res) => {
    const { image, url } = req.body;

    if (!image && !url) {
        return res.status(400).json({ message: 'Please provide a QR image (base64) or a URL.' });
    }

    try {
        let targetUrl = url;
        let scanSource = 'URL Input';

        // 1. Decode Image if provided
        if (image) {
            scanSource = 'Image';
            try {
                targetUrl = await decodeQR(image);
                console.log(`[DEBUG] Decoded QR Content: '${targetUrl}'`);
            } catch (qrErr) {
                return res.status(400).json({
                    message: 'Could not decode QR code from image.',
                    error: qrErr.message
                });
            }
        }

        // 2. Validate URL existence
        if (!targetUrl) {
            return res.status(400).json({ message: 'No valid URL/Data found in request.' });
        }

        // 3. Perform Threat Intelligence Scan
        const scanResult = await scanURL(targetUrl);

        // 4. Log to Database - DISABLED for optimization
        // (Logging logic removed as it was unused and commented out)

        // 5. Return SOC Report
        res.json({
            success: true,
            data: {
                ...scanResult,
                scanId: 'LOCALLY-SCANNED', // logEntry._id,
                scannedAt: new Date() // logEntry.scannedAt
            }
        });

    } catch (error) {
        console.error('QR Scan Module Error:', error);
        res.status(500).json({ message: 'Internal Server Error during Scan', error: error.message });
    }
});

module.exports = router;
