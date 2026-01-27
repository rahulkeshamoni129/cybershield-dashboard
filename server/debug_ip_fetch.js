require('dotenv').config();
const axios = require('axios');

const debugFetch = async () => {
    const key = process.env.ALIENVAULT_OTX_KEY;
    console.log('Key available:', !!key);

    const COUNTRIES = ['US'];
    const getRandomItem = (arr) => arr[0];

    const extractThreats = (pulses, sourceName) => {
        const threats = [];
        if (!pulses) return threats;
        console.log(`Scanning ${pulses.length} pulses from ${sourceName}...`);

        pulses.forEach(pulse => {
            if (pulse.indicators) {
                let ipCount = 0;
                pulse.indicators.forEach(ind => {
                    if (ind.type === 'IPv4' || ind.type === 'IPv6') {
                        ipCount++;
                        threats.push({
                            ipAddress: ind.indicator, // Just for count
                        });
                    }
                });
                console.log(`  Pulse "${pulse.name.substring(0, 30)}...": ${ipCount} IPs`);
            } else {
                console.log(`  Pulse "${pulse.name.substring(0, 30)}...": No indicators loaded (maybe shallow object)`);
            }
        });
        return threats;
    };

    try {
        // 1. Subscribed
        console.log('\n--- Checking Subscribed ---');
        let response = await axios.get('https://otx.alienvault.com/api/v1/pulses/subscribed?limit=5', {
            headers: { 'X-OTX-API-KEY': key }
        });
        let threats = extractThreats(response.data.results, 'Subscribed');
        console.log(`Total Threats found in Subscribed: ${threats.length}`);

        // 2. Specific User Fallback (AlienVault user)
        console.log('\n--- Checking User "AlienVault" Pulses ---');
        response = await axios.get('https://otx.alienvault.com/api/v1/users/AlienVault/pulses?limit=5', {
            headers: { 'X-OTX-API-KEY': key }
        });

        if (response.data.results.length > 0) {
            console.log('Sample User Pulse Result Keys:', Object.keys(response.data.results[0]));
        }

        threats = extractThreats(response.data.results, 'User AlienVault');
        console.log(`Total Threats found in User AlienVault: ${threats.length}`);

    } catch (e) {
        console.error('Error:', e.message);
    }
};

debugFetch();
