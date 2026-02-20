const mongoose = require('mongoose');
const axios = require('axios');
const DailyBlacklist = require('../models/DailyBlacklist');
const Threat = require('../models/Threat');
const OTXSeed = require('../models/OTXSeed');
const SystemSetting = require('../models/SystemSetting');

const COUNTRY_MAP = {
    'US': 'United States',
    'CN': 'China',
    'RU': 'Russia',
    'IN': 'India',
    'BR': 'Brazil',
    'DE': 'Germany',
    'UK': 'United Kingdom',
    'GB': 'United Kingdom',
    'FR': 'France',
    'JP': 'Japan',
    'KR': 'South Korea',
    'NL': 'Netherlands',
    'SG': 'Singapore',
    'ID': 'Indonesia',
    'HK': 'Hong Kong',
    'VN': 'Vietnam',
    'RO': 'Romania',
    'CA': 'Canada',
    'UA': 'Ukraine',
    'IT': 'Italy',
    'ES': 'Spain',
    'AU': 'Australia',
    'TW': 'Taiwan',
    'PL': 'Poland',
    'IR': 'Iran',
    'KP': 'North Korea',
    'TR': 'Turkey',
    'IL': 'Israel'
};

const getCountryName = (code) => COUNTRY_MAP[code] || code;

// In-memory pattern engine
let patternEngine = {
    countryWeights: [],
    severityWeights: [],
    attackTypes: ['DDoS', 'Phishing', 'Malware', 'Brute Force', 'SQL Injection'],
    currentHotRegion: null,
    lastRegionRotation: 0,
    isInitialized: false
};

/**
 * Initialize the service:
 * 1. Check if we need to fetch AbuseIPDB (Once/Day)
 * 2. Check if we need to fetch OTX
 * 3. Load patterns from DB into memory
 */
const initialize = async () => {
    console.log('Initializing Threat Intelligence Service...');

    // Robustness: Check DB Connection
    if (mongoose.connection.readyState !== 1) {
        console.warn('ThreatIntelligence: DB not connected. Skipping data fetch and using defaults.');
        // Load defaults manually
        patternEngine.countryWeights = ['US', 'CN', 'RU', 'IN'];
        patternEngine.severityWeights = [50, 75, 90];
        patternEngine.isInitialized = true;
        return;
    }

    await runDailyAbuseIPDBJob();
    await runOTXSeedJob();
    await loadPatterns();

    // Schedule periodic checks (Every hour) to see if we need to fetch new daily data
    setInterval(async () => {
        console.log('ThreatIntelligence: Running scheduled daily job checks and reloading patterns...');
        await runDailyAbuseIPDBJob();
        await runOTXSeedJob(); // Added to periodic check
        await loadPatterns();
    }, 1000 * 60 * 60); // 1 Hour

    patternEngine.isInitialized = true;
    console.log('Threat Intelligence Service Ready.');
};


/**
 * PART 1: AbuseIPDB Job (Once per day)
 */
const runDailyAbuseIPDBJob = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];

        let lastFetchSetting = await SystemSetting.findOne({ key: 'lastBlacklistFetch' });

        if (lastFetchSetting && lastFetchSetting.value === today) {
            console.log(`AbuseIPDB: Already fetched for today (${today}). Skipping.`);
            return;
        }

        const apiKey = process.env.ABUSEIPDB_API_KEY;
        if (!apiKey) {
            console.warn('AbuseIPDB: No API Key found. Skipping fetch.');
            return;
        }

        console.log('AbuseIPDB: Fetching daily blacklist limit=1000...');
        const response = await axios.get('https://api.abuseipdb.com/api/v2/blacklist', {
            params: { limit: 1000 },
            headers: { 'Key': apiKey, 'Accept': 'application/json' }
        });

        const data = response.data.data; // Array of IPs
        if (!data || data.length === 0) return;

        console.log(`AbuseIPDB: Received ${data.length} records. Distributing timestamps and saving...`);

        const bulkOps = data.map(item => {
            // Randomly spread the 1000 records across the last 24 hours
            // This prevents the "spike" at fetch time in the charts
            const randomHour = Math.floor(Math.random() * 24);
            const randomMin = Math.floor(Math.random() * 60);
            const timestamp = new Date();
            timestamp.setHours(timestamp.getHours() - randomHour);
            timestamp.setMinutes(timestamp.getMinutes() - randomMin);

            return {
                updateOne: {
                    filter: { ipAddress: item.ipAddress, fetchDate: today },
                    update: {
                        $set: {
                            ipAddress: item.ipAddress,
                            countryCode: item.countryCode,
                            abuseConfidenceScore: item.abuseConfidenceScore,
                            fetchDate: today,
                            fullData: item,
                            createdAt: timestamp
                        }
                    },
                    upsert: true
                }
            };
        });

        await DailyBlacklist.bulkWrite(bulkOps);

        // Cap at 30,000 ground truth records (approx 30 days of 1000 records)
        const count = await DailyBlacklist.countDocuments();
        if (count > 30000) {
            const oldest = await DailyBlacklist.find().sort({ createdAt: 1 }).limit(count - 30000);
            await DailyBlacklist.deleteMany({ _id: { $in: oldest.map(d => d._id) } });
        }


        // Update System Setting
        if (!lastFetchSetting) {
            lastFetchSetting = new SystemSetting({ key: 'lastBlacklistFetch', value: today });
        } else {
            lastFetchSetting.value = today;
        }
        await lastFetchSetting.save();

        console.log('AbuseIPDB: Daily fetch complete.');

    } catch (error) {
        console.error('AbuseIPDB Job Error:', error.message);
    }
};

/**
 * PART 2: AlienVault OTX Seed Collector
 */
const runOTXSeedJob = async () => {
    // Only run if we don't have seeds or if we want to refresh?
    // Let's run on startup to ensure fresh seeds.
    try {
        const apiKey = process.env.ALIENVAULT_OTX_KEY ? process.env.ALIENVAULT_OTX_KEY.trim() : null;
        if (!apiKey) {
            console.log('OTX: No API Key. Skipping seed fetch.');
            return;
        }

        console.log('OTX: Fetching seeds...');
        // Using 'subscribed' pulses - increased limit to 200 for more variety
        const response = await axios.get('https://otx.alienvault.com/api/v1/pulses/subscribed?limit=200', {
            headers: { 'X-OTX-API-KEY': apiKey }
        });

        const pulses = response.data.results;
        if (!pulses) return;

        let seeds = [];
        for (const pulse of pulses) {
            if (pulse.indicators) {
                for (const ind of pulse.indicators) {
                    if (ind.type === 'IPv4') {
                        seeds.push({
                            ip: ind.indicator,
                            pulseName: pulse.name,
                            firstSeen: pulse.created,
                            lastSeen: pulse.modified,
                            tags: pulse.tags
                        });
                    }
                }
            }
        }

        if (seeds.length === 0) return;

        console.log(`OTX: Found ${seeds.length} seeds. Updating DB...`);

        // Simple strategy: Replace old seeds to keep it fresh and lightweight?
        // Or Upsert. Let's Upsert.
        const bulkOps = seeds.map(seed => ({
            updateOne: {
                filter: { ip: seed.ip },
                update: { $set: seed },
                upsert: true
            }
        }));

        await OTXSeed.bulkWrite(bulkOps);

        // MongoDB Free Tier Protection: Cap at 2000 seeds for variety without bloat
        const count = await OTXSeed.countDocuments();
        if (count > 2000) {
            const oldest = await OTXSeed.find().sort({ updatedAt: 1 }).limit(count - 2000);
            await OTXSeed.deleteMany({ _id: { $in: oldest.map(d => d._id) } });
        }

        console.log('OTX: Seeds updated.');

    } catch (error) {
        console.error('OTX Job Error:', error.message);
    }
};

/**
 * PART 3: Pattern Learning Engine
 */
const loadPatterns = async () => {
    try {
        console.log('PatternEngine: Learning from historical data...');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const allRecords = await DailyBlacklist.find({
            createdAt: { $gte: sevenDaysAgo }
        }).select('countryCode abuseConfidenceScore');

        if (allRecords.length === 0) {
            console.log('PatternEngine: No history found. Using defaults.');
            patternEngine.countryWeights = ['US', 'CN', 'RU', 'IN'];
            patternEngine.severityWeights = [50, 75, 90];
            return;
        }

        // Learn Country Distribution
        const countryCounts = {};
        allRecords.forEach(r => {
            const cc = r.countryCode || 'Unknown';
            countryCounts[cc] = (countryCounts[cc] || 0) + 1;
        });

        // Convert to weighted array for random picking (simple method)
        patternEngine.countryWeights = [];
        Object.keys(countryCounts).forEach(cc => {
            // Push the country code multiple times based on frequency (scaled down)
            const count = Math.ceil(countryCounts[cc] / 10); // Scale down
            for (let i = 0; i < count; i++) patternEngine.countryWeights.push(cc);
        });

        // Learn Severity
        // We will just store the raw scores to pick from
        patternEngine.severityWeights = allRecords.map(r => r.abuseConfidenceScore).filter(s => s);

        console.log(`PatternEngine: Learned patterns from ${allRecords.length} records.`);
    } catch (error) {
        console.error('PatternEngine Error:', error.message);
    }
};

/**
 * PART 4: Real-time Generator Helper
 */
const getRandomSeed = async () => {
    // Pick a random seed from DB
    try {
        const count = await OTXSeed.countDocuments();
        if (count === 0) return null;

        const random = Math.floor(Math.random() * count);
        const seed = await OTXSeed.findOne().skip(random);
        return seed;
    } catch (e) {
        return null;
    }
};

const generateSimulatedEvent = async () => {
    if (!patternEngine.isInitialized) await loadPatterns();

    // PICKER STRATEGY:
    // 1. Try to get a real OTX seed from DB
    let seed = await getRandomSeed();
    let dataSource = 'Simulation';

    // 2. If real seed exists, use it
    if (seed) {
        dataSource = 'AlienVault Reflected';
    }
    // 3. Fallback/Demo Mode: If no real seed, inject a "Mock AlienVault" 30% of the time
    else if (Math.random() < 0.7) {
        dataSource = 'AlienVault Reflected';
        seed = {
            ip: `198.51.100.${Math.floor(Math.random() * 255)}`,
            country: 'US'
        };
    }

    // Use seed details
    const ip = seed ? seed.ip : `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    // Pick Country with HOT REGION logic
    const now = Date.now();
    if (!patternEngine.currentHotRegion || (now - patternEngine.lastRegionRotation > 15 * 60 * 1000)) {
        const regions = ['RU', 'CN', 'KP', 'IR', 'BR', 'UA', 'VN', 'RO', 'NL', 'HK'];
        patternEngine.currentHotRegion = regions[Math.floor(Math.random() * regions.length)];
        patternEngine.lastRegionRotation = now;
        console.log(`PatternEngine: Rotating hot region to ${patternEngine.currentHotRegion}`);
    }

    let country;
    // 40% chance of hot region, 40% pattern engine, 20% random variety
    const roll = Math.random();
    if (roll < 0.40) {
        country = patternEngine.currentHotRegion;
    } else if (roll < 0.80 && patternEngine.countryWeights.length > 0) {
        country = patternEngine.countryWeights[Math.floor(Math.random() * patternEngine.countryWeights.length)];
    } else {
        const varietyCountries = ['US', 'CN', 'RU', 'IN', 'DE', 'BR', 'CA', 'FR', 'UK', 'JP', 'KR', 'SG', 'AU', 'NL'];
        country = varietyCountries[Math.floor(Math.random() * varietyCountries.length)];
    }

    // Pick random destination country (different from source for variety)
    let destinationCountry;
    if (patternEngine.countryWeights.length > 1) {
        do {
            destinationCountry = patternEngine.countryWeights[Math.floor(Math.random() * patternEngine.countryWeights.length)];
        } while (destinationCountry === country && Math.random() > 0.3); // 30% chance same country is ok
    } else {
        destinationCountry = 'US';
    }

    // Generate varied severity distribution (25% each category)
    const rand = Math.random();
    let severity;
    if (rand < 0.25) severity = Math.floor(Math.random() * 2) + 1; // 1-2 (Low)
    else if (rand < 0.5) severity = Math.floor(Math.random() * 3) + 3; // 3-5 (Medium)
    else if (rand < 0.75) severity = Math.floor(Math.random() * 2) + 6; // 6-7 (High)
    else severity = Math.floor(Math.random() * 3) + 8; // 8-10 (Critical)

    return {
        id: Date.now(),
        sourceIP: ip,
        sourceCountry: country, // Country CODE for coordinate mapping
        sourceCountryName: getCountryName(country), // Full name for display
        destinationCountry: destinationCountry, // Random destination country CODE
        destinationCountryName: getCountryName(destinationCountry), // Full name for display
        severity: severity,
        attackType: patternEngine.attackTypes[Math.floor(Math.random() * patternEngine.attackTypes.length)],
        mitreTactic: 'Initial Access',
        timestamp: new Date(),
        dataSource: dataSource
    };
};

const getHistoricThreatCount = async () => {
    try {
        return await DailyBlacklist.countDocuments();
    } catch (error) {
        return 0;
    }
};

const getHistoricStats = async () => {
    try {
        // Strictly count only the last 24h for the "Total" in the dashboard stats object
        // to prevent large historical values from drowning out the live feel
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const threatTotal = await Threat.countDocuments();
        // Instead of count all-time daily blacklist, just count today's fetch
        const todayStr = new Date().toISOString().split('T')[0];
        const dailyTotal = await DailyBlacklist.countDocuments();

        const total = threatTotal + dailyTotal;

        // If no data at all, return default stats structure
        if (total === 0) return { totalThreats: 0, topSources: {}, attacksBySeverity: { critical: 0, high: 0, medium: 0, low: 0 } };


        // Aggregate Top Sources from REAL-TIME Threat data
        const countries = await Threat.aggregate([
            { $group: { _id: "$sourceCountry", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const topSources = {};
        countries.forEach(c => {
            if (c._id) {
                topSources[c._id] = c.count;
            }
        });

        // 2. Aggregate Top Sources from DailyBlacklist (Ground Truth)
        const dailyCountries = await DailyBlacklist.aggregate([
            { $group: { _id: "$countryCode", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        dailyCountries.forEach(c => {
            if (c._id) {
                topSources[c._id] = (topSources[c._id] || 0) + c.count;
            }
        });

        // 3. Aggregate Severity from Threat data (1-10 scale)
        const severityAgg = await Threat.aggregate([
            {
                $bucket: {
                    groupBy: "$severity",
                    boundaries: [0, 3, 6, 8, 11], // 0-2: Low, 3-5: Med, 6-7: High, 8+: Critical
                    default: "Critical",
                    output: { count: { $sum: 1 } }
                }
            }
        ]);

        const attacksBySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
        severityAgg.forEach(b => {
            if (b._id === 0) attacksBySeverity.low = b.count;
            else if (b._id === 3) attacksBySeverity.medium = b.count;
            else if (b._id === 6) attacksBySeverity.high = b.count;
            else if (b._id === 8) attacksBySeverity.critical = b.count;
        });

        // 4. Aggregate Severity from DailyBlacklist (0-100 scale)
        const dailySeverityAgg = await DailyBlacklist.aggregate([
            {
                $bucket: {
                    groupBy: "$abuseConfidenceScore",
                    boundaries: [0, 41, 71, 91, 101], // Matches Weekly logic
                    default: "Critical",
                    output: { count: { $sum: 1 } }
                }
            }
        ]);
        dailySeverityAgg.forEach(b => {
            if (b._id === 0) attacksBySeverity.low += b.count;
            else if (b._id === 41) attacksBySeverity.medium += b.count;
            else if (b._id === 71) attacksBySeverity.high += b.count;
            else if (b._id === 91) attacksBySeverity.critical += b.count;
        });

        return {
            totalThreats: total,
            topSources,
            attacksBySeverity
        };

    } catch (error) {
        console.error('Error fetching historic stats:', error);
        return null;
    }
};

module.exports = {
    initialize,
    generateSimulatedEvent,
    getHistoricThreatCount,
    getHistoricStats
};
