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
    details: Object
});

module.exports = mongoose.model('Threat', ThreatSchema);
