const express = require('express');
const router = express.Router();

// Mock Internal Assets/Devices
const INTERNAL_ASSETS = [
    { id: 'dev-1', name: 'Primary Firewall', ip: '192.168.1.1', type: 'firewall', status: 'online', vulnerabilities: 0, openPorts: [80, 443], lastScan: new Date() },
    { id: 'dev-2', name: 'Main Router', ip: '192.168.1.254', type: 'router', status: 'online', vulnerabilities: 1, openPorts: [22, 80], lastScan: new Date() },
    { id: 'dev-3', name: 'Database Server', ip: '192.168.1.10', type: 'server', status: 'online', vulnerabilities: 0, openPorts: [5432, 22], lastScan: new Date() },
    { id: 'dev-4', name: 'Web Server 01', ip: '192.168.1.11', type: 'server', status: 'warning', vulnerabilities: 3, openPorts: [80, 443, 8080], lastScan: new Date() },
    { id: 'dev-5', name: 'FileSystem Server', ip: '192.168.1.12', type: 'server', status: 'online', vulnerabilities: 1, openPorts: [445, 139], lastScan: new Date() },
    { id: 'dev-6', name: 'Backup Server', ip: '192.168.1.20', type: 'server', status: 'offline', vulnerabilities: 0, openPorts: [], lastScan: new Date() },
    { id: 'dev-7', name: 'Analyst Workstation', ip: '192.168.1.50', type: 'workstation', status: 'online', vulnerabilities: 2, openPorts: [3389], lastScan: new Date() },
    { id: 'dev-8', name: 'Dev-Lab-01', ip: '192.168.1.100', type: 'workstation', status: 'online', vulnerabilities: 5, openPorts: [22, 8000, 3000], lastScan: new Date() },
];

router.get('/assets', (req, res) => {
    res.json(INTERNAL_ASSETS);
});

module.exports = router;
