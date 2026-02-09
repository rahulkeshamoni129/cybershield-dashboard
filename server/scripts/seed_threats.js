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
        for (let i = 0; i < 200; i++) {
            // Distribute severity evenly: 25% each category
            let severity;
            const rand = i % 4;
            if (rand === 0) severity = Math.floor(Math.random() * 3) + 1; // 1-2 (Low)
            else if (rand === 1) severity = Math.floor(Math.random() * 3) + 3; // 3-5 (Medium)
            else if (rand === 2) severity = Math.floor(Math.random() * 2) + 6; // 6-7 (High)
            else severity = Math.floor(Math.random() * 3) + 8; // 8-10 (Critical)

            threats.push({
                sourceCountry: countries[Math.floor(Math.random() * countries.length)],
                destinationCountry: 'US',
                attackType: types[Math.floor(Math.random() * types.length)],
                severity: severity,
                timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)),
            });
        }

        await Threat.insertMany(threats);
        console.log('Seeded 200 threats with varied severity');
        process.exit();
    } catch (err) {
        console.error('Seed Error:', err);
        process.exit(1);
    }
}

seed();
