const axios = require('axios');
const Threat = require('../models/Threat');

const nmapService = require('./nmapService');

const COUNTRIES = ['US', 'CN', 'RU', 'IN', 'BR', 'DE', 'UK', 'FR', 'JP', 'KR'];
const ATTACK_TYPES = ['DDoS', 'SQL Injection', 'Brute Force', 'Malware', 'Phishing', 'XSS'];

let blacklistCache = [];
let lastFetchTime = 0;

let interval;

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateMockAttack = () => {
    return {
        id: new Date().getTime(),
        sourceCountry: getRandomItem(COUNTRIES),
        destinationCountry: getRandomItem(COUNTRIES),
        attackType: getRandomItem(ATTACK_TYPES),
        timestamp: new Date(),
        ipFrom: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        ipTo: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        severity: Math.floor(Math.random() * 10) + 1,
        dataSource: 'Simulation'
    };
};

const fetchBlacklist = async (redisClient) => {
    let success = false;

    // 1. Try AlienVault OTX first (Higher limits)
    if (process.env.ALIENVAULT_OTX_KEY && process.env.ALIENVAULT_OTX_KEY.length > 10) {
        try {
            console.log('Fetching threat data from AlienVault OTX (Subscribed)...');
            // INCREASED LIMIT: Fetch more pulses to increase chance of finding IPv4 indicators
            let response = await axios.get('https://otx.alienvault.com/api/v1/pulses/subscribed?limit=50', {
                headers: { 'X-OTX-API-KEY': process.env.ALIENVAULT_OTX_KEY }
            });

            const extractThreats = (pulses) => {
                const threats = [];
                if (!pulses) return threats;
                pulses.forEach(pulse => {
                    if (pulse.indicators) {
                        pulse.indicators.forEach(ind => {
                            // Accept IPv4 and now IPv6 (mapped to string)
                            if (ind.type === 'IPv4' || ind.type === 'IPv6') {
                                threats.push({
                                    ipAddress: ind.indicator,
                                    countryCode: getRandomItem(COUNTRIES),
                                    abuseConfidenceScore: Math.floor(Math.random() * 50) + 45,
                                    desc: pulse.name,
                                    dataSource: 'AlienVault'
                                });
                            }
                        });
                    }
                });
                return threats;
            };

            let newThreats = extractThreats(response.data?.results);
            console.log(`AlienVault Scan: Found ${newThreats.length} actionable IPs from ${response.data?.results?.length || 0} pulses.`);

            if (newThreats.length > 0) {
                blacklistCache = newThreats;
                console.log(`AlienVault OTX: Successfully updated cache with ${blacklistCache.length} malicious IPs.`);
                success = true;
            } else {
                console.log('AlienVault OTX: No IPs found in recent pulses. Cache remains empty (will use Simulation).');
            }
        } catch (error) {
            console.error('AlienVault OTX Error:', error.message);
        }
    }

    // 2. Fallback: If OTX failed or is not configured
    if (!success) {
        console.log('Using internal simulation (No external threat feeds configured or available).');
    }

    // CRITICAL FIX: Always update lastFetchTime to prevent "Retry Loop of Death"
    // Even if it fails, we wait 15 minutes before trying again.
    lastFetchTime = Date.now();
};

// Aggregated Real-time Stats
let stats = {
    totalThreats: 0,
    activeThreats: 0,
    blockedAttacks: 0,
    systemHealth: 98,
    criticalAlerts: 0,
    typeDistribution: {},
    topSources: {
        'US': 5340,
        'CN': 1740,
        'RU': 1230,
        'IN': 980,
        'BR': 750
    },
    attacksBySeverity: { critical: 0, high: 0, medium: 0, low: 0 }
};

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

const socketManager = (io, redisClient) => {
    // Initial Fetch
    fetchBlacklist(redisClient);

    io.on('connection', (socket) => {
        console.log('New client connected', socket.id);
        socket.emit('dashboard_stats', stats); // Send immediate stats on connect

        // Handle Network Scan Request
        // Handle Network Scan Request
        socket.on('start_network_scan', (target) => {
            console.log('Network scan requested by', socket.id, 'Target:', target);

            // Notify start
            socket.emit('scan_progress', 10); // Start at 10% to show activity

            nmapService.scan(target,
                (device) => {
                    // Device Discovered
                    socket.emit('device_discovered', device);
                },
                (allDevices) => {
                    // Scan Complete
                    socket.emit('scan_progress', 100);
                    socket.emit('scan_complete', allDevices);
                },
                (errorMsg) => {
                    // Error
                    console.error('Nmap Scan Error:', errorMsg);
                    // We can emit an error event or just complete to reset state
                    socket.emit('scan_error', errorMsg);
                    socket.emit('scan_progress', 100); // Reset UI
                }
            );
        });

        socket.on('disconnect', () => console.log('Client disconnected'));
    });

    // Simulation/Real-time Loop
    if (interval) clearInterval(interval);

    interval = setInterval(async () => {
        let attack;

        // Use Real Data if available
        if (blacklistCache.length > 0) {
            const realThreat = getRandomItem(blacklistCache);
            attack = {
                id: new Date().getTime(),
                sourceCountry: realThreat.countryCode || getRandomItem(COUNTRIES),
                destinationCountry: getRandomItem(COUNTRIES),
                attackType: realThreat.desc ? 'Threat Pulse' : getRandomItem(ATTACK_TYPES),
                timestamp: new Date(),
                ipFrom: realThreat.ipAddress,
                ipTo: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                severity: Math.ceil((realThreat.abuseConfidenceScore || 50) / 10),
                dataSource: realThreat.dataSource
            };
        } else {
            // Fallback to Mock
            attack = generateMockAttack();
        }

        // Update Stats
        stats.totalThreats++;
        stats.activeThreats = Math.floor(Math.random() * 50) + 10; // Fluctuation
        if (Math.random() > 0.7) stats.blockedAttacks++;

        // Update Type Distribution
        if (!stats.typeDistribution[attack.attackType]) stats.typeDistribution[attack.attackType] = 0;
        stats.typeDistribution[attack.attackType]++;

        // Update Top Sources (Real-time aggregation)
        if (!stats.topSources) stats.topSources = {};
        if (!stats.topSources[attack.sourceCountry]) stats.topSources[attack.sourceCountry] = 0;
        stats.topSources[attack.sourceCountry]++;

        // Update Severity Stats (Reset daily in real world, but just increment here for demo)
        const severityKey = attack.severity >= 9 ? 'critical' : attack.severity >= 7 ? 'high' : attack.severity >= 4 ? 'medium' : 'low';
        stats.attacksBySeverity[severityKey]++;

        if (severityKey === 'critical') stats.criticalAlerts++;

        // Update History (For Analytics Page - Simple version)
        const currentHour = new Date().getHours();
        const hourLabel = `${currentHour}:00`;

        // Initialize history if needed (24h window)
        if (!stats.history) {
            stats.history = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, attacks: 0, blocked: 0 }));
        }

        // Find current hour bucket or mock it for demo if we want valid-looking charts immediately
        // For real usage: stats.history[currentHour].attacks++
        // For demo visual: let's increment the last item to show movement
        const historyIdx = stats.history.findIndex(h => h.hour === hourLabel);
        if (historyIdx !== -1) {
            stats.history[historyIdx].attacks++;
            if (Math.random() > 0.7) stats.history[historyIdx].blocked++;
        } else {
            // Fallback for simple demo, increment the last one
            stats.history[23].attacks++;
        }

        // Broadcast to all clients
        io.emit('attack_event', attack);
        io.emit('dashboard_stats', stats);

        // Refresh Blacklist every 15 minutes
        if (Date.now() - lastFetchTime > 15 * 60 * 1000) {
            fetchBlacklist(redisClient);
        }

    }, 3000); // Emit every 3 seconds
};

// Export property to access the cache
socketManager.getThreats = () => blacklistCache;

module.exports = socketManager;
