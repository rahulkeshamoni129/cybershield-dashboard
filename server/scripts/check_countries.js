const mongoose = require('mongoose');
require('dotenv').config();
const DailyBlacklist = require('../models/DailyBlacklist');

const checkCountries = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to DB');

        const countries = await DailyBlacklist.aggregate([
            { $group: { _id: "$countryCode", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 15 }
        ]);

        console.log('Top 15 Countries in Database:');
        countries.forEach((c, i) => {
            console.log(`${i + 1}. ${c._id}: ${c.count}`);
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkCountries();
