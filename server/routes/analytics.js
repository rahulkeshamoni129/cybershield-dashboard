const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        totalAttacks: 14502,
        topAttackerCountries: ['CN', 'RU', 'US', 'IN'],
        attacksByType: {
            'DDoS': 4500,
            'Phishing': 3200,
            'Malware': 2100
        },
        severityDistribution: {
            'High': 20,
            'Medium': 50,
            'Low': 30
        }
    });
});

module.exports = router;
