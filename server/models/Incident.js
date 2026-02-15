const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    status: {
        type: String,
        enum: ['Open', 'Investigating', 'Resolved', 'Closed'],
        default: 'Open'
    },
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    assignee: {
        type: String,
        default: 'AI System'
    },
    affectedAssets: [String],
    timeline: [{
        action: String,
        user: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }],
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Incident', IncidentSchema);
