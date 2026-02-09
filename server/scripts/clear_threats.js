const mongoose = require('mongoose');
const Threat = require('./models/Threat.js');
const dotenv = require('dotenv');

dotenv.config();

async function clearThreats() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const result = await Threat.deleteMany({});
        console.log('Cleared ' + result.deletedCount + ' threats');
        
        console.log('Database cleared. New threats will now be generated in real-time.');
        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

clearThreats();
