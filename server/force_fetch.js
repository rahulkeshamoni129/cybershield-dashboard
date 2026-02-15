require('dotenv').config();
const mongoose = require('mongoose');
const { initialize } = require('./services/threatIntelligence');
const connectDB = require('./config/db');
const SystemSetting = require('./models/SystemSetting');

const forceFetch = async () => {
    try {
        await connectDB();
        console.log('Connected to DB for manual fetch...');

        // Reset the last fetch setting so the service thinks it hasn't fetched today
        await SystemSetting.deleteMany({ key: 'lastBlacklistFetch' });
        console.log('Reset last fetch timestamp.');

        // Initialize service - this will trigger runDailyAbuseIPDBJob()
        console.log('Starting fetch job...');
        await initialize();

        console.log('Fetch complete. Check the database to see the distributed timestamps.');
        process.exit(0);
    } catch (error) {
        console.error('Error during manual fetch:', error);
        process.exit(1);
    }
};

forceFetch();
