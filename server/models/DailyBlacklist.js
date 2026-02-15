const mongoose = require('mongoose');

const DailyBlacklistSchema = new mongoose.Schema({
    ipAddress: {
        type: String,
        required: true,
        index: true
    },
    countryCode: String,
    abuseConfidenceScore: Number,
    fetchDate: {
        type: String, // YYYY-MM-DD
        index: true
    },
    fullData: Object, // store original response just in case
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: 2592000 } // Keep for 30 days to support monthly trends
    }
});

module.exports = mongoose.model('DailyBlacklist', DailyBlacklistSchema);

