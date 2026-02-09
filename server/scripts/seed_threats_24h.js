const mongoose = require('mongoose');
const Threat = require('./models/Threat.js');
const dotenv = require('dotenv');

dotenv.config();

const types = ['DDoS', 'Malware', 'Phishing', 'SQL Injection', 'Brute Force'];
const countries = ['US', 'CN', 'RU', 'IN', 'BR', 'DE', 'FR'];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        await Threat.deleteMany({});
        console.log('Cleared existing threats');

        const threats = [];
        const now = Date.now();

        // Create threats distributed across all 24 hours
        for (let hour = 0; hour < 24; hour++) {
            // Generate 8-15 threats per hour for variety
            const threatsPerHour = Math.floor(Math.random() * 8) + 8;

            for (let i = 0; i < threatsPerHour; i++) {
                // Distribute severity evenly
                let severity;
                const rand = i % 4;
                if (rand === 0) severity = Math.floor(Math.random() * 2) + 1;
                else if (rand === 1) severity = Math.floor(Math.random() * 3) + 3;
                else if (rand === 2) severity = Math.floor(Math.random() * 2) + 6;
                else severity = Math.floor(Math.random() * 3) + 8;

                // Create timestamp for this specific hour (going backwards from now)
                const hoursAgo = 23 - hour;
                const timestamp = new Date(now - (hoursAgo * 60 * 60 * 1000) - (Math.random() * 60 * 60 * 1000));

                threats.push({
                    sourceCountry: countries[Math.floor(Math.random() * countries.length)],
                    destinationCountry: 'US',
                    attackType: types[Math.floor(Math.random() * types.length)],
                    severity: severity,
                    timestamp: timestamp,
                });
            }
        }

        await Threat.insertMany(threats);
        console.log('Seeded ' + threats.length + ' threats distributed across 24 hours');
        process.exit();
    } catch (err) {
        console.error('Seed Error:', err);
        process.exit(1);
    }
}

seed();
