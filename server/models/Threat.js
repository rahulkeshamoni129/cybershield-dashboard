const mongoose = require('mongoose');

const ThreatSchema = new mongoose.Schema({
    sourceCountry: String,
    destinationCountry: String,
    attackType: String,
    timestamp: {
        type: Date,
        default: Date.now
    },
    ipFrom: String,
    ipTo: String,
    severity: Number,
    details: Object,
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: 86400 } // Delete after 24 hours
    }
});

module.exports = mongoose.model('Threat', ThreatSchema);

