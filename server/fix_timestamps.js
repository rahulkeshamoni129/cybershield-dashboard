require('dotenv').config();
const mongoose = require('mongoose');
const DailyBlacklist = require('./models/DailyBlacklist');
const connectDB = require('./config/db');

const fixTimestamps = async () => {
    try {
        await connectDB();
        console.log('Connected to DB. Fetching records...');

        const records = await DailyBlacklist.find({});
        console.log(`Found ${records.length} records. Redistributing timestamps...`);

        const bulkOps = records.map(record => {
            const randomHour = Math.floor(Math.random() * 24);
            const randomMin = Math.floor(Math.random() * 60);
            const timestamp = new Date();
            timestamp.setHours(timestamp.getHours() - randomHour);
            timestamp.setMinutes(timestamp.getMinutes() - randomMin);

            return {
                updateOne: {
                    filter: { _id: record._id },
                    update: { $set: { createdAt: timestamp } }
                }
            };
        });

        if (bulkOps.length > 0) {
            await DailyBlacklist.bulkWrite(bulkOps);
            console.log('Successfully redistributed timestamps for existing records.');
        } else {
            console.log('No records found to update.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error fixing timestamps:', error);
        process.exit(1);
    }
};

fixTimestamps();
