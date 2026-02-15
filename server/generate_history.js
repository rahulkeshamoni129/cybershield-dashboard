require('dotenv').config();
const mongoose = require('mongoose');
const DailyBlacklist = require('./models/DailyBlacklist');
const connectDB = require('./config/db');

const countries = ['US', 'CN', 'RU', 'IN', 'BR', 'DE', 'UK', 'FR', 'JP', 'KR'];
const scores = [20, 45, 65, 85, 95];

const generateHistory = async () => {
    try {
        await connectDB();
        console.log('Generating 30 days of historical threat data...');

        // Clear existing mock data if needed, or just append
        // await DailyBlacklist.deleteMany({}); 

        const bulkOps = [];
        const now = new Date();

        for (let i = 1; i <= 30; i++) {
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() - i);
            const dateStr = targetDate.toISOString().split('T')[0];

            console.log(`Generating data for ${dateStr}...`);

            // Generate 500 records per day to show variety
            for (let j = 0; j < 500; j++) {
                const hour = Math.floor(Math.random() * 24);
                const min = Math.floor(Math.random() * 60);
                const createdAt = new Date(targetDate);
                createdAt.setHours(hour);
                createdAt.setMinutes(min);

                bulkOps.push({
                    insertOne: {
                        document: {
                            ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                            countryCode: countries[Math.floor(Math.random() * countries.length)],
                            abuseConfidenceScore: scores[Math.floor(Math.random() * scores.length)],
                            fetchDate: dateStr,
                            createdAt: createdAt,
                            fullData: { mock: true }
                        }
                    }
                });

                // Batch process every 5000 ops to save memory
                if (bulkOps.length >= 5000) {
                    await DailyBlacklist.bulkWrite(bulkOps);
                    bulkOps.length = 0;
                }
            }
        }

        if (bulkOps.length > 0) {
            await DailyBlacklist.bulkWrite(bulkOps);
        }

        console.log('Successfully generated 15,000 historical records (30 days).');
        process.exit(0);
    } catch (error) {
        console.error('Error generating history:', error);
        process.exit(1);
    }
};

generateHistory();
