const threatIntelligence = require('./threatIntelligence');
const nmapService = require('./nmapService');
const Threat = require('../models/Threat');

// Real-time Stats Container
let stats = {
    totalThreats: 0,
    activeThreats: 0,
    blockedAttacks: 0,
    systemHealth: 98,
    criticalAlerts: 0,
    typeDistribution: {},
    topSources: {}, // Will be populated dynamically
    attacksBySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
    history: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, attacks: 0, blocked: 0 }))
};

const networkRouter = require('../routes/network');


const socketManager = (io, redisClient) => {
    // Initialize the Threat Intelligence Service (Part 1, 2, 3)
    threatIntelligence.initialize().then(async () => {
        // 1. Sync "Total Threats" and distribution from DB
        const historicStats = await threatIntelligence.getHistoricStats();

        if (historicStats) {
            console.log('SocketManager: Loaded historic stats from DB.');
            stats.totalThreats = historicStats.totalThreats;

            // Merge Top Sources
            stats.topSources = historicStats.topSources || {};

            // Merge Severity
            stats.attacksBySeverity = historicStats.attacksBySeverity || stats.attacksBySeverity;
            stats.criticalAlerts = stats.attacksBySeverity.critical;

            // Initialize Types (Simulated distribution based on total, since types are not strictly in DB)
            // This ensures the "Attacks by Type" chart isn't empty on load
            const types = ['DDoS', 'Malware', 'Phishing', 'Brute Force'];
            types.forEach(type => {
                // Distribute roughly evenly for the baseline
                stats.typeDistribution[type] = Math.floor(stats.totalThreats / types.length);
            });
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected', socket.id);
        socket.emit('dashboard_stats', stats);

        // Network Scan Handler (Preserved from original)
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

                    // Update persistent assets in router (in-memory for this session)
                    if (networkRouter.updateAssets) {
                        console.log(`SocketManager: Updating ${allDevices.length} discovered assets in router.`);
                        networkRouter.updateAssets(allDevices);
                    }
                },
                (errorMsg) => {
                    // Error
                    console.error('Nmap Scan Error:', errorMsg);
                    socket.emit('scan_error', errorMsg);
                    socket.emit('scan_progress', 100); // Reset UI
                }
            );
        });

        socket.on('disconnect', () => console.log('Client disconnected'));
    });

    // PART 4: Real-Time Attack Generator
    // Every 3 seconds
    setInterval(async () => {
        try {
            // Generate event using Pattern Engine
            const event = await threatIntelligence.generateSimulatedEvent();

            // Format for Frontend (Must match existing schema expected by UI)
            const frontendEvent = {
                id: event.id,
                sourceCountry: event.sourceCountry, // Country CODE (e.g., 'US', 'CN')
                destinationCountry: event.destinationCountry,
                attackType: event.attackType, // e.g., 'Threat Pulse' or 'DDoS'
                timestamp: event.timestamp,
                ipFrom: event.sourceIP,
                ipTo: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // Simulated Internal IP
                severity: event.severity,
                dataSource: event.dataSource, // Add dataSource to root for frontend visibility
                details: {
                    mitre: event.mitreTactic,
                    dataSource: event.dataSource
                }
            };

            // Update Real-time Stats
            updateStats(frontendEvent);

            // Save to DB for history
            const threatDoc = new Threat({
                sourceCountry: frontendEvent.sourceCountry,
                destinationCountry: frontendEvent.destinationCountry,
                attackType: frontendEvent.attackType,
                timestamp: frontendEvent.timestamp,
                ipFrom: frontendEvent.ipFrom,
                ipTo: frontendEvent.ipTo,
                severity: frontendEvent.severity,
                details: frontendEvent.details
            });

            threatDoc.save()
                .then(async () => {
                    console.log(`✓ Threat saved: ${frontendEvent.sourceCountry} → ${frontendEvent.destinationCountry}`);

                    // MongoDB Free Tier Protection: Keep only the latest 2000 records
                    try {
                        const count = await Threat.countDocuments();
                        if (count > 2000) {
                            // Find the cutoff timestamp for the 2000th newest record
                            const cutoff = await Threat.find()
                                .sort({ timestamp: -1 })
                                .skip(1999)
                                .limit(1)
                                .select('timestamp');

                            if (cutoff && cutoff.length > 0) {
                                // Delete anything older than the cutoff
                                await Threat.deleteMany({ timestamp: { $lt: cutoff[0].timestamp } });
                            }
                        }
                    } catch (err) {
                        console.error('✗ Limit Enforcement Error:', err);
                    }
                })
                .catch(e => console.error('✗ Sim Save Error:', e));


            // Emit
            io.emit('attack_event', frontendEvent);
            io.emit('dashboard_stats', stats);

        } catch (error) {
            console.error('Socket Loop Error:', error.message);
        }
    }, 3000);
};

// Helper to update in-memory stats for the dashboard
function updateStats(attack) {
    stats.totalThreats++;
    stats.activeThreats = Math.floor(Math.random() * 50) + 10; // Simulated fluctuation

    // Randomly "block" some
    if (Math.random() > 0.6) stats.blockedAttacks++;

    // Type Dist - Dynamic Keys
    const type = attack.attackType || 'Unknown';
    if (!stats.typeDistribution[type]) stats.typeDistribution[type] = 0;
    stats.typeDistribution[type]++;

    // Top Sources - Dynamic Keys
    const country = attack.sourceCountry || 'Unknown';
    if (!stats.topSources[country]) stats.topSources[country] = 0;
    stats.topSources[country]++;

    // Severity
    const s = attack.severity;
    if (s >= 9) {
        stats.attacksBySeverity.critical = (stats.attacksBySeverity.critical || 0) + 1;
        stats.criticalAlerts++;
    } else if (s >= 7) {
        stats.attacksBySeverity.high = (stats.attacksBySeverity.high || 0) + 1;
    } else if (s >= 4) {
        stats.attacksBySeverity.medium = (stats.attacksBySeverity.medium || 0) + 1;
    } else {
        stats.attacksBySeverity.low = (stats.attacksBySeverity.low || 0) + 1;
    }

    // History (Simple rolling update for demo)
    const currentHour = new Date().getHours();
    // For visual effect, just increment the last bucket or current hour
    const idx = stats.history.findIndex(h => h.hour.startsWith(currentHour.toString()));
    if (idx !== -1) {
        stats.history[idx].attacks++;
    } else {
        // Fallback if hour format doesn't match roughly
        stats.history[stats.history.length - 1].attacks++;
    }
}

socketManager.getThreats = () => []; // Legacy support if needed

module.exports = socketManager;
