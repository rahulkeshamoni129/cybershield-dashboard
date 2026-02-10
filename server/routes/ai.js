const express = require('express');
const axios = require('axios');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5001';

// Public Test Endpoint (No token required for diagnostics)
router.get('/test-ai', async (req, res) => {
    try {
        const response = await axios.get(`${AI_ENGINE_URL}/test-ai`);
        res.json(response.data);
    } catch (error) {
        console.error('AI Test Error:', error.message);
        const status = error.response ? error.response.status : 500;
        const data = error.response ? error.response.data : { error: "Failed to connect to AI engine." };
        res.status(status).json(data);
    }
});

// Protected Chat Endpoint (Requires Token)
router.post('/chat', protect, requireRole('user'), async (req, res) => {
    try {
        const response = await axios.post(`${AI_ENGINE_URL}/chat`, req.body, {
            timeout: 30000
        });
        res.json(response.data);
    } catch (error) {
        console.error('AI Engine Error:', error.message);
        if (error.code === 'ECONNABORTED') {
            return res.json({ reply: "The AI is taking too long to respond. Please try again in a moment." });
        }
        res.json({
            reply: "I am having trouble connecting to my AI brain right now.",
            source: "Local System (Fallback)",
            severity: "Info"
        });
    }
});

// Protected Training Endpoint (Requires Token)
router.post('/train', protect, requireRole('user'), async (req, res) => {
    try {
        const response = await axios.post(`${AI_ENGINE_URL}/train`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error('AI Training Error:', error.message);
        res.status(500).json({ error: "Failed to train AI core." });
    }
});

module.exports = router;
