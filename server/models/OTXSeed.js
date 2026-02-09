const mongoose = require('mongoose');

const OTXSeedSchema = new mongoose.Schema({
    ip: {
        type: String,
        required: true,
        unique: true
    },
    pulseName: String,
    firstSeen: Date,
    lastSeen: Date,
    tags: [String]
});

module.exports = mongoose.model('OTXSeed', OTXSeedSchema);
