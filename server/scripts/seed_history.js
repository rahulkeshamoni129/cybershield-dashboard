const mongoose = require('mongoose');
const DailyBlacklist = require('./models/DailyBlacklist');
const dotenv = require('dotenv');

dotenv.config();

async function seedHistoricalAbuseData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Optional: Clear existing daily blacklist to start fresh
        // await DailyBlacklist.deleteMany({});

        const entries = [];
        const now = new Date();

        console.log('Generating 30 days of historical threat data...');

        for (let i = 0; i < 30; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            // Generate a random number of threats for this day (between 150 and 400)
            const count = Math.floor(Math.random() * 250) + 150;

            for (let j = 0; j < count; j++) {
                entries.push({
                    ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                    countryCode: ['US', 'CN', 'RU', 'IN', 'NL', 'SG', 'BR', 'DE', 'GB', 'FR'][Math.floor(Math.random() * 10)],
                    abuseConfidenceScore: Math.floor(Math.random() * 100),
                    fetchDate: dateString,
                    lastReportedAt: date
                });
            }
        }

        console.log(`Inserting ${entries.length} historical records...`);
        await DailyBlacklist.insertMany(entries);
        console.log('Historical seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seedHistoricalAbuseData();
