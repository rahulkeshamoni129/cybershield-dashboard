const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/authMiddleware');

// User Management Routes

// Get all users (Admin only)
router.get('/users', protect, requireRole('admin'), async (req, res) => {
    try {
        // Exclude the currently logged-in user (admin) from the results
        const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Update user role (Admin only)
router.put('/users/:id/role', protect, requireRole('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.role = req.body.role || user.role;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Delete user (Admin only)
router.delete('/users/:id', protect, requireRole('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Create user (Admin only)
router.post('/users', protect, requireRole('admin'), async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = await User.create({ username, email, password, role });
        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// System Info Routes (Admin only)

// Get Logs (Mock)
router.get('/logs', protect, requireRole('admin'), (req, res) => {
    const logs = [
        { id: 1, action: 'User Login', user: 'admin', timestamp: new Date() },
        { id: 2, action: 'Threat Detected', details: 'IP 192.168.1.5', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
        { id: 3, action: 'System Scan', status: 'Completed', timestamp: new Date(Date.now() - 1000 * 60 * 60) },
        { id: 4, action: 'API Key Updated', user: 'admin', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) }
    ];
    res.json(logs);
});

// Get System Health (including User Count)
router.get('/system-health', protect, requireRole('admin'), async (req, res) => {
    try {
        const os = require('os');
        const userCount = await User.countDocuments({});

        // Calculate Real Memory Usage
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        // Return structured data
        res.json({
            status: 'Healthy', // This is still subjective, but you could add logic (e.g. if FreeMem < 10% => 'Critical')
            uptime: os.uptime(),
            memoryUsage: {
                rss: (totalMem - freeMem), // Resident Set Size (Approximated as Used Mem)
                heapTotal: totalMem,
                heapUsed: totalMem - freeMem,
                external: 0
            },
            cpuLoad: os.loadavg(), // Returns [1min, 5min, 15min] averages
            userCount: userCount,
            platform: os.platform(),
            architecture: os.arch()
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching system health' });
    }
});

// Get API Keys (Mock/Real)
router.get('/api-keys', protect, requireRole('admin'), (req, res) => {
    res.json({
        abuseIpDb: process.env.ABUSEIPDB_API_KEY ? 'Configured' : 'Missing',

    });
});

// Update API Keys (Mock)
router.put('/api-keys', protect, requireRole('admin'), (req, res) => {
    res.json({ message: 'API Keys updated successfully (Mock)' });
});

module.exports = router;
