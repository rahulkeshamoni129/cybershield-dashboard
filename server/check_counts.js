require('dotenv').config();
const mongoose = require('mongoose');
const DailyBlacklist = require('./models/DailyBlacklist');
const connectDB = require('./config/db');

const checkCounts = async () => {
    try {
        await connectDB();
        const counts = await DailyBlacklist.aggregate([
            { $group: { _id: "$fetchDate", count: { $sum: 1 } } },
            { $sort: { _id: -1 } }
        ]);
        console.log('Records per fetchDate:');
        console.table(counts);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
checkCounts();
