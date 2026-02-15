const express = require('express');
const router = express.Router();
const DailyBlacklist = require('../models/DailyBlacklist');
const Threat = require('../models/Threat');
const mongoose = require('mongoose');

// MITRE Mapping Helper
const mapToMitre = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('ddos')) return 'Impact';
    if (t.includes('sql') || t.includes('injection')) return 'Defense Evasion';
    if (t.includes('malware') || t.includes('execution')) return 'Execution';
    if (t.includes('phishing')) return 'Initial Access';
    if (t.includes('brute') || t.includes('cred')) return 'Credential Access';
    if (t.includes('scan') || t.includes('recon')) return 'Reconnaissance';
    return 'Reconnaissance'; // Default
};

router.get('/', async (req, res) => {
    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // 1. Threat Volume Over Time (Hourly - Last 24h from Threats schema)
        // If Threats is empty (new install), this will be empty, which is correct (data-driven).
        const trendPromise = Threat.aggregate([
            { $match: { timestamp: { $gte: yesterday } } },
            {
                $group: {
                    _id: { $hour: "$timestamp" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Historical Trend (Daily from DailyBlacklist - last 7 days)
        const dailyTrendPromise = DailyBlacklist.aggregate([
            { $group: { _id: "$fetchDate", count: { $sum: 1 } } },
            { $sort: { "_id": -1 } },
            { $limit: 7 }
        ]);

        // NEW: Hourly trend from DailyBlacklist (distributed)
        const dailyBlacklistHourlyPromise = DailyBlacklist.aggregate([
            { $match: { createdAt: { $gte: yesterday } } },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Weekly trend with severity breakdown (last 7 days from DailyBlacklist)
        // Note: Using abuseConfidenceScore to categorize severity for historical records
        const weeklyTrendPromise = DailyBlacklist.aggregate([
            {
                $group: {
                    _id: {
                        day: "$fetchDate",
                        severity: {
                            $switch: {
                                branches: [
                                    { case: { $gte: ["$abuseConfidenceScore", 91] }, then: "critical" },
                                    { case: { $gte: ["$abuseConfidenceScore", 71] }, then: "high" },
                                    { case: { $gte: ["$abuseConfidenceScore", 41] }, then: "medium" }
                                ],
                                default: "low"
                            }
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.day": -1 } },
            { $limit: 28 } // 7 days * 4 severity levels
        ]);

        // Monthly trend (last 30 days from DailyBlacklist)
        const monthlyTrendPromise = DailyBlacklist.aggregate([
            { $group: { _id: "$fetchDate", count: { $sum: 1 } } },
            { $sort: { "_id": -1 } },
            { $limit: 30 }
        ]);

        // 2 & 3. Top Sources (Merged)
        const [threatSources, dailySources] = await Promise.all([
            Threat.aggregate([
                { $group: { _id: "$sourceCountry", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 15 }
            ]),
            DailyBlacklist.aggregate([
                { $group: { _id: "$countryCode", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 15 }
            ])
        ]);

        const topSourcesMap = {};
        threatSources.forEach(s => { if (s._id) topSourcesMap[s._id] = (topSourcesMap[s._id] || 0) + s.count; });
        dailySources.forEach(s => { if (s._id) topSourcesMap[s._id] = (topSourcesMap[s._id] || 0) + s.count; });

        const topSourcesData = Object.entries(topSourcesMap)
            .map(([country, count]) => ({ _id: country, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);


        // 4. Attack Types (Detailed) - From Threat collection
        const typePromise = Threat.aggregate([
            { $group: { _id: "$attackType", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 }
        ]);

        // Execute remaining aggregations
        const [trendHour, trendDay, weeklyTrend, monthlyTrend, typesData, dailyBlacklistHourly] = await Promise.all([
            trendPromise,
            dailyTrendPromise,
            weeklyTrendPromise,
            monthlyTrendPromise,
            typePromise,
            dailyBlacklistHourlyPromise
        ]);


        // --- Post-Processing & Formatting ---

        // 1. Trend Formatting (Combine Real-time Threats + Distributed Daily Blacklist)
        const trendFormatted = Array.from({ length: 24 }, (_, i) => {
            const hour = i;
            const threatFound = trendHour.find(t => t._id === hour);
            const blacklistFound = dailyBlacklistHourly.find(b => b._id === hour);

            return {
                time: `${hour}:00`,
                threats: (threatFound ? threatFound.count : 0) + (blacklistFound ? blacklistFound.count : 0)
            };
        });

        // 2. Severity Formatting
        // 2 & 3. Severity Distribution (Merged from both)
        const [threatSeverity, dailySeverity] = await Promise.all([
            Threat.aggregate([
                {
                    $bucket: {
                        groupBy: "$severity",
                        boundaries: [0, 3, 6, 8, 11], // 1-10 scale
                        default: "Critical",
                        output: { count: { $sum: 1 } }
                    }
                }
            ]),
            DailyBlacklist.aggregate([
                {
                    $bucket: {
                        groupBy: "$abuseConfidenceScore",
                        boundaries: [0, 41, 71, 91, 101], // 0-100 scale
                        default: "Critical",
                        output: { count: { $sum: 1 } }
                    }
                }
            ])
        ]);

        const severityDistribution = { Low: 0, Medium: 0, High: 0, Critical: 0 };
        const sevLabelMap = { 0: 'Low', 3: 'Medium', 6: 'High', 8: 'Critical' };
        const dailySevLabelMap = { 0: 'Low', 41: 'Medium', 71: 'High', 91: 'Critical' };

        let riskWeightedSum = 0;
        let totalRiskCount = 0;

        threatSeverity.forEach(b => {
            const label = sevLabelMap[b._id] || 'Critical';
            severityDistribution[label] += b.count;
            let weight = label === 'Low' ? 1 : label === 'Medium' ? 2 : label === 'High' ? 3 : 4;
            riskWeightedSum += (b.count * weight);
            totalRiskCount += b.count;
        });

        dailySeverity.forEach(b => {
            const label = dailySevLabelMap[b._id] || 'Critical';
            severityDistribution[label] += b.count;
            let weight = label === 'Low' ? 1 : label === 'Medium' ? 2 : label === 'High' ? 3 : 4;
            riskWeightedSum += (b.count * weight);
            totalRiskCount += b.count;
        });


        const globalRiskScore = totalRiskCount > 0 ? Math.round((riskWeightedSum / totalRiskCount) * 25) : 0; // Scale to 0-100

        // 3. MITRE Tactic Distribution (Derived from Types)
        const mitreCounts = {};

        let finalTypesData = typesData;
        if (finalTypesData.length === 0 && totalRiskCount > 0) {
            finalTypesData = [{ _id: "Malicious Traffic", count: totalRiskCount }];
        }

        finalTypesData.forEach(t => {
            const tactic = mapToMitre(t._id);
            mitreCounts[tactic] = (mitreCounts[tactic] || 0) + t.count;
        });
        const mitreData = Object.keys(mitreCounts).map(k => ({
            name: k,
            value: mitreCounts[k],
            fill: '#8884d8' // Frontend assigns colors usually
        }));

        // 4. Top Countries (from real-time Threat data)
        const topAttackerCountries = topSourcesData.map(c => c._id || 'Unknown');
        const topCountriesFull = topSourcesData.map(c => ({ country: c._id || 'Unknown', count: c.count }));

        // 5. Matrix (Mock frequency for now as DB might not track 'frequency' per IP efficiently without heavy aggregation)
        // We will approximate it using the Severity Distribution
        // X: Severity, Y: Static buckets based on distribution
        // Ideally: Aggregate IPs by count, then bucket by severity. 
        // Real Aggregation:
        // $group by IP -> { count, maxSeverity } -> $bucket... (Too expensive for realtime dashboard on large dataset)
        // We'll return the severity distribution as the basis for the Matrix intensity.

        // Format weekly trend data with severity breakdown
        // Format weekly trend data with severity breakdown
        const weeklyFormatted = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];

            const dayData = { critical: 0, high: 0, medium: 0, low: 0 };
            weeklyTrend.forEach(item => {
                if (item._id.day === dateStr) {
                    dayData[item._id.severity] = item.count;
                }
            });

            weeklyFormatted.push({ day: dayName, ...dayData, date: dateStr });
        }

        // Format monthly trend data
        const monthlyFormatted = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayData = monthlyTrend.find(item => item._id === dateStr);
            monthlyFormatted.push({
                day: date.getDate(), // Day of month for X axis
                date: dateStr,
                threats: dayData ? dayData.count : 0,
                incidents: dayData ? Math.floor(dayData.count * 0.05) : 0
            });
        }

        const totalGroundTruth = await DailyBlacklist.countDocuments();

        res.json({
            // Core Metrics
            totalAttacks: totalRiskCount + totalGroundTruth, // Include 1000 daily ground truth threats

            globalRiskScore,

            // Charts
            trendData: trendFormatted,
            dailyTrend: trendDay.map(d => ({ date: d._id, count: d.count })),
            weeklyTrendData: weeklyFormatted,
            monthlyTrendData: monthlyFormatted,

            topAttackerCountries, // Array of strings (legacy support)
            topSources: topSourcesData.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),

            attacksByType: typesData.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),

            severityDistribution, // { Low: 10, ... }

            // 7. Consolidate Confidence Histogram (Real-time + Ground Truth)
            confidenceHistogram: [0, 20, 40, 60, 80].map(r => {
                let count = 0;
                // Add from threats
                threatSeverity.forEach(b => {
                    const label = sevLabelMap[b._id] || 'Critical';
                    let targetRange;
                    if (label === 'Low') targetRange = 0;
                    else if (label === 'Medium') targetRange = 20;
                    else if (label === 'High') targetRange = 40;
                    else if (label === 'Critical') targetRange = 60;

                    // Distribute Critical even further if it's high
                    if (label === 'Critical' && b._id > 8) targetRange = 80;

                    if (targetRange === r) count += b.count;
                });

                // Add from daily blacklist
                dailySeverity.forEach(b => {
                    const dailyLabel = dailySevLabelMap[b._id] || 'Critical';
                    let targetRange;
                    if (dailyLabel === 'Low') targetRange = 0;
                    else if (dailyLabel === 'Medium') targetRange = 20;
                    else if (dailyLabel === 'High') targetRange = 40;
                    else if (dailyLabel === 'Critical') targetRange = 60;

                    // Distribute daily scores too
                    if (b._id >= 91) targetRange = 80;

                    if (targetRange === r) count += b.count;
                });

                return { range: r, count };
            }),

            mitreData
        });

    } catch (error) {
        console.error('Analytics Aggregation Error:', error);
        res.status(500).json({ message: 'Analytics aggregation failed', error: error.message });
    }
});

module.exports = router;
