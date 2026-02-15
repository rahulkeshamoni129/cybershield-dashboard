require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const fixTTLIndex = async () => {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const collection = db.collection('dailyblacklists');

        console.log('Checking indexes...');
        const indexes = await collection.indexes();
        console.log(JSON.stringify(indexes, null, 2));

        const ttlIndex = indexes.find(idx => idx.key.createdAt && idx.expireAfterSeconds);

        if (ttlIndex) {
            console.log(`Found TTL index: ${ttlIndex.name}. Dropping it...`);
            await collection.dropIndex(ttlIndex.name);
            console.log('Index dropped successfully.');
        } else {
            console.log('No TTL index found with expireAfterSeconds.');
        }

        console.log('Creating new TTL index with 30-day (2592000s) expiration...');
        await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
        console.log('New index created.');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

fixTTLIndex();
