const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');
const router = express.Router();

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ username, email, password });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id, user.role),
                role: user.role
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const { protect } = require('../middleware/authMiddleware');

router.get('/test', (req, res) => res.json({ message: 'Auth router is working' }));

router.post('/changepassword', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        // Prevent password changes for mock users
        if (req.user._id && typeof req.user._id === 'string' && req.user._id.startsWith('mock-')) {
            return res.status(400).json({ message: 'Password changes are not allowed for demo/mock accounts.' });
        }

        const user = await User.findById(req.user._id);

        if (user && (await user.matchPassword(currentPassword))) {
            user.password = newPassword;
            await user.save();
            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(401).json({ message: 'Invalid current password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/profile', protect, async (req, res) => {
    try {
        if (req.user._id && typeof req.user._id === 'string' && req.user._id.startsWith('mock-')) {
            return res.status(400).json({ message: 'Profile updates are not allowed for demo accounts.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (req.body.department) {
            user.department = req.body.department;
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            department: updatedUser.department
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // HARDCODED FALLBACK: Always allow this user
        if (email === 'analyst@cybershield.io' && password === (process.env.DEFAULT_ANALYST_PASSWORD || 'analyst123')) {
            return res.json({
                _id: 'mock-analyst-id',
                username: 'Analyst User',
                email: email,
                token: generateToken('mock-analyst-id', 'user'),
                role: 'user'
            });
        }


        // Fallback for Demo Mode (if DB is down)
        if (mongoose.connection.readyState !== 1) {
            console.log('DB Offline: Attempting Demo Login');
            if (email === 'admin@cybershield.io' && password === (process.env.DEFAULT_ADMIN_PASSWORD || 'admin123')) {
                return res.json({
                    _id: 'mock-admin-id',
                    username: 'Admin User',
                    email: email,
                    token: generateToken('mock-admin-id', 'admin'),
                    role: 'admin'
                });
            }
            if (email === 'analyst@cybershield.io' && password === (process.env.DEFAULT_ANALYST_PASSWORD || 'analyst123')) {
                return res.json({
                    _id: 'mock-analyst-id',
                    username: 'Analyst User',
                    email: email,
                    token: generateToken('mock-analyst-id', 'user'),
                    role: 'user'
                });
            }
            if (email === 'user' && password === 'user') { // Simple fallback
                return res.json({
                    _id: 'mock-analyst-id',
                    username: 'Analyst User',
                    email: 'analyst@cybershield.io',
                    token: generateToken('mock-analyst-id', 'user'),
                    role: 'user'
                });
            }
        }

        let user = await User.findOne({ email });

        // Auto-create Admin/Analyst for convenience if they don't exist
        if (!user) {
            if (email === 'admin@cybershield.io' && password === (process.env.DEFAULT_ADMIN_PASSWORD || 'admin123')) {
                console.log('Seed: Creating Admin User');
                user = await User.create({
                    username: 'Admin User',
                    email: 'admin@cybershield.io',
                    password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
                    role: 'admin'
                });
            } else if (email === 'analyst@cybershield.io' && password === (process.env.DEFAULT_ANALYST_PASSWORD || 'analyst123')) {
                console.log('Seed: Creating Analyst User');
                user = await User.create({
                    username: 'Analyst User',
                    email: 'analyst@cybershield.io',
                    password: process.env.DEFAULT_ANALYST_PASSWORD || 'analyst123',
                    role: 'user'
                });
            }
        }

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id, user.role),
                role: user.role
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
