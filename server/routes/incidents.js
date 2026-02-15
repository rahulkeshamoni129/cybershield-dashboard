const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const socketManager = require('../services/socketManager');

// Helper to generate a unique Incident ID
const generateIncidentId = () => {
    return 'INC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

const Threat = require('../models/Threat');

// @route   GET /api/incidents
// @desc    Get all incidents (Limit 50, backfilled with threats)
router.get('/', async (req, res) => {
    try {
        // 1. Get official managed incidents from DB (Limit 50)
        const dbIncidents = await Incident.find().sort({ created: -1 }).limit(50);

        let incidentsList = [...dbIncidents];

        // 2. If we have fewer than 50 managed incidents, fill with real-time threats from history
        if (incidentsList.length < 50) {
            const fillCount = 50 - incidentsList.length;
            const recentThreats = await Threat.find()
                .sort({ timestamp: -1 })
                .limit(fillCount);

            if (recentThreats && recentThreats.length > 0) {
                const threatIncidents = recentThreats.map((threat) => {
                    const sevScore = threat.severity || 5;
                    let severity = 'Medium';
                    if (sevScore >= 9) severity = 'Critical';
                    else if (sevScore >= 7) severity = 'High';
                    else if (sevScore <= 3) severity = 'Low';

                    return {
                        id: `LIVE-${threat._id.toString().slice(-6).toUpperCase()}`,
                        title: `${threat.attackType} from ${threat.ipFrom}`,
                        status: 'Open',
                        severity: severity,
                        assignee: 'AI System',
                        created: threat.timestamp,
                        description: `Real-time threat detected. Source: ${threat.sourceCountry}, Target: ${threat.destinationCountry} (${threat.ipTo}).`,
                        affectedAssets: ['Edge-Firewall'],
                        timeline: [{
                            action: 'Detected by IDS',
                            user: 'System',
                            timestamp: threat.timestamp
                        }]
                    };
                });
                incidentsList = [...incidentsList, ...threatIncidents];

                // Final sort to make sure managed incidents and threats are interleaved correctly by time
                incidentsList.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
                incidentsList = incidentsList.slice(0, 50);
            }
        }

        res.json(incidentsList);
    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({ message: 'Error retrieving incidents' });
    }
});

// @route   POST /api/incidents
// @desc    Create a new incident
router.post('/', async (req, res) => {
    try {
        console.log('Incident POST request received:', req.body);
        const { title, description, severity, affectedAssets } = req.body;

        const username = req.user ? (req.user.username || 'Admin') : 'Admin';

        const newIncident = new Incident({
            id: generateIncidentId(),
            title,
            description,
            severity: severity || 'Medium',
            affectedAssets: affectedAssets || ['General Asset'],
            assignee: username,
            timeline: [{
                action: 'Incident Created',
                user: username,
                timestamp: new Date()
            }]
        });

        const savedIncident = await newIncident.save();
        console.log('Incident saved successfully:', savedIncident.id);
        res.status(201).json(savedIncident);
    } catch (error) {
        console.error('Error creating incident:', error);
        res.status(500).json({
            message: 'Error creating incident',
            error: error.message
        });
    }
});

// @route   PATCH /api/incidents/:id/status
// @desc    Update incident status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        let incident = await Incident.findOne({ id: req.params.id });

        if (!incident) {
            // If it's a LIVE incident, we promote it to a DB incident on first action
            if (req.params.id.startsWith('LIVE-') || req.params.id.startsWith('SOC-')) {
                // We'd ideally need more data from frontend here if it's not in DB, 
                // but for now we'll create a skeletal one or use defaults.
                incident = new Incident({
                    id: req.params.id,
                    title: req.body.title || 'Uncategorized Threat',
                    description: req.body.description || 'Promoted from live threat feed.',
                    severity: req.body.severity || 'Medium',
                    affectedAssets: req.body.affectedAssets || ['Gateway'],
                    assignee: req.user.username || 'Admin'
                });
            } else {
                return res.status(404).json({ message: 'Incident not found' });
            }
        }

        incident.status = status;
        incident.timeline.push({
            action: `Status updated to ${status}`,
            user: req.user.username || 'Admin',
            timestamp: new Date()
        });

        await incident.save();
        res.json(incident);
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Error updating incident status' });
    }
});

// @route   POST /api/incidents/:id/notes
// @desc    Add a note/comment to the timeline
router.post('/:id/notes', async (req, res) => {
    try {
        const { note } = req.body;
        let incident = await Incident.findOne({ id: req.params.id });

        if (!incident) {
            // Promote live/mock incident to DB
            if (req.params.id.startsWith('LIVE-') || req.params.id.startsWith('SOC-')) {
                incident = new Incident({
                    id: req.params.id,
                    title: req.body.title || 'Uncategorized Threat',
                    description: req.body.description || 'Promoted from live threat feed.',
                    severity: req.body.severity || 'Medium',
                    affectedAssets: req.body.affectedAssets || ['Gateway'],
                    assignee: req.user.username || 'Admin'
                });
            } else {
                return res.status(404).json({ message: 'Incident not found' });
            }
        }

        incident.timeline.push({
            action: 'Note Added',
            user: req.user.username || 'Admin',
            timestamp: new Date(),
            note: note
        });

        await incident.save();
        res.json(incident);
    } catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ message: 'Error adding note' });
    }
});

module.exports = router;

