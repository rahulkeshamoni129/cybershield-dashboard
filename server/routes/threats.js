const express = require('express');
const router = express.Router();
const axios = require('axios');

// Get Live Threats (Mock or DB)
router.get('/live', (req, res) => {
    res.json({ message: 'Live threats stream established via WebSocket' });
});

// AbuseIPDB Lookup Proxy
router.get('/ip/:ip', async (req, res) => {
    try {
        const { ip } = req.params;
        const apiKey = process.env.ABUSEIPDB_API_KEY;

        if (!apiKey || apiKey === 'your_key_here' || apiKey === 'PLACE_YOUR_ABUSEIPDB_KEY_HERE') {
            // Mock Response if no API Key
            console.log(`No AbuseIPDB API key found, returning mock data for ${ip}`);
            const mockData = {
                ipAddress: ip,
                isPublic: true,
                ipVersion: 4,
                isWhitelisted: false,
                abuseConfidenceScore: Math.floor(Math.random() * 100),
                countryCode: 'US',
                usageType: 'Data Center',
                isp: 'Google LLC',
                domain: 'google.com',
                hostnames: [],
                totalReports: Math.floor(Math.random() * 50),
                numDistinctUsers: Math.floor(Math.random() * 10),
                lastReportedAt: new Date().toISOString()
            };
            return res.json({ data: mockData });
        }

        const response = await axios.get('https://api.abuseipdb.com/api/v2/check', {
            params: {
                ipAddress: ip,
                maxAgeInDays: 90,
                verbose: true
            },
            headers: {
                'Key': apiKey,
                'Accept': 'application/json'
            }
        });

        res.json({ data: response.data.data });
    } catch (error) {
        console.error('AbuseIPDB Error:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Error fetching IP data',
            error: error.response?.data || error.message
        });
    }
});

module.exports = router;
