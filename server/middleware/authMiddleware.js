const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

            // If DB is offline OR user is a mock user (from hardcoded fallback in login)
            if (mongoose.connection.readyState !== 1 || (decoded.id && decoded.id.startsWith && decoded.id.startsWith('mock-'))) {
                req.user = {
                    _id: decoded.id,
                    role: decoded.role || 'user'
                };
            } else {
                req.user = await User.findById(decoded.id).select('-password');
                if (!req.user) {
                    return res.status(401).json({ message: 'Not authorized, user not found' });
                }
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const requireRole = (role) => {
    return (req, res, next) => {
        // Admin has access to everything a user has access to.
        // So if required role is 'user', admin also passes.
        // If required role is 'admin', only admin passes.
        if (req.user && (req.user.role === role || req.user.role === 'admin')) {
            next();
        } else {
            res.status(403).json({ message: `Access denied. Requires ${role} role.` });
        }
    };
};

module.exports = { protect, requireRole };
