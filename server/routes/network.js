const express = require('express');
const router = express.Router();

// Internal Assets/Devices (Initially empty, only populated by scans)
let INTERNAL_ASSETS = [];

router.get('/assets', (req, res) => {
    res.json(INTERNAL_ASSETS);
});

// Helper to update assets (can be called from socketManager)
router.updateAssets = (newAssets) => {
    INTERNAL_ASSETS = newAssets;
};

module.exports = router;

