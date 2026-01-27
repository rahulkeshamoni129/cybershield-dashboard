const express = require('express');
const router = express.Router();

// Mock Incidents Data (Fallback) and Real Data Merger
const socketManager = require('../services/socketManager');

router.get('/', (req, res) => {
    try {
        const realThreats = socketManager.getThreats ? socketManager.getThreats() : [];

        let incidentsList = [];

        if (realThreats && realThreats.length > 0) {
            incidentsList = realThreats.map((threat, index) => {
                // Determine status based on confidence score (simulation)
                const score = threat.abuseConfidenceScore || 50;
                let status = 'Open';
                if (score < 60) status = 'Resolved';
                else if (score < 80) status = 'Investigating';

                let severity = 'Low';
                if (score > 90) severity = 'Critical';
                else if (score > 75) severity = 'High';
                else if (score > 50) severity = 'Medium';

                return {
                    id: `SOC-${1000 + index}`,
                    title: threat.desc || `Suspicious Activity from ${threat.ipAddress}`,
                    status: status,
                    severity: severity,
                    assignee: 'AI System',
                    created: new Date().toISOString(), // Use ISO for smoother frontend parsing
                    description: `Detected threat from ${threat.ipAddress} (${threat.countryCode}). Confidence: ${score}%`,
                    affectedAssets: [`Server-Gateway-${index % 5}`],
                    timeline: [
                        { action: 'Threat Detected', user: 'System', timestamp: new Date() }
                    ]
                };
            });
        }

        // Appending legacy/mock items if list is empty to avoid blank screen
        if (incidentsList.length === 0) {
            incidentsList = [
                {
                    id: 'MOCK-1',
                    title: 'Unauthorized Access Attempt (Simulation)',
                    status: 'Open',
                    severity: 'High',
                    assignee: 'Admin',
                    created: new Date().toISOString(),
                    description: 'Simulated incident pending real threat data.',
                    affectedAssets: ['Gateway'],
                    timeline: []
                }
            ];
        }

        res.json(incidentsList);
    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({ message: 'Error retrieving incidents' });
    }
});

router.post('/', (req, res) => {
    // Just a mock response for now, as we don't have a Persistent Incident Model yet
    res.status(201).json({ message: 'Incident reported' });
});

module.exports = router;
