require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const connectDB = require('./config/db');
const socketManager = require('./services/socketManager');
const threatRoutes = require('./routes/threats');
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const aiRoutes = require('./routes/ai');
const analyticsRoutes = require('./routes/analytics');


const networkRoutes = require('./routes/network');
const adminRoutes = require('./routes/admin');
const { protect, requireRole } = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379'
});
redisClient.on('error', (err) => {
    // console.log('Redis Client Error', err)
});
// redisClient.connect().catch(console.error);
redisClient.connect().catch((err) => console.log('Redis connection error:', err.message));
app.set('redisClient', redisClient);

// Socket.IO Setup
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); // Admin routes are protected internally by the route handlers
app.use('/api/threats', protect, requireRole('user'), threatRoutes);
app.use('/api/incidents', protect, requireRole('user'), incidentRoutes);

app.use('/api/ai', aiRoutes);
app.use('/api/analytics', protect, requireRole('user'), analyticsRoutes);

app.use('/api/network', protect, requireRole('user'), networkRoutes);
app.use('/api/qr', protect, requireRole('user'), require('./routes/qr'));

app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: dbStatus === 'connected' ? 'ok' : 'error',
        database: dbStatus,
        timestamp: new Date()
    });
});

app.get('/', (req, res) => {
    res.send('CyberShield SOC API is running...');
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server Error' });
});

const PORT = process.env.PORT || 5000;

// Start Server Wrapper
const startServer = async () => {
    try {
        // Database Connection
        await connectDB();

        // Initialize Socket Manager (Real-time Engine) after DB attempt
        // Ideally we only run this if DB connected, or make it resilient
        socketManager(io, redisClient);

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
