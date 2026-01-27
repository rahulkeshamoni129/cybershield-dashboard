const express = require('express');
const axios = require('axios');
const router = express.Router();

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://ai-engine:5001';

router.post('/chat', async (req, res) => {
    try {
        const response = await axios.post(`${AI_ENGINE_URL}/chat`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error('AI Engine Error:', error.message);
        // Fallback response if AI is down
        res.json({ reply: "I am having trouble connecting to my AI brain right now. However, I can still help you analyze basic threat data." });
    }
});

router.post('/train', async (req, res) => {
    try {
        const response = await axios.post(`${AI_ENGINE_URL}/train`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error('AI Training Error:', error.message);
        res.status(500).json({ error: "Failed to train AI core." });
    }
});

module.exports = router;
