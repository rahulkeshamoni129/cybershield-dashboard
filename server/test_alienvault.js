require('dotenv').config();
const axios = require('axios');

const testAlienVault = async () => {
    const key = process.env.ALIENVAULT_OTX_KEY;
    console.log('Testing Key:', key ? key.substring(0, 5) + '...' : 'MISSING');

    if (!key) return;

    try {
        console.log('Attempting fetch from /pulses/subscribed...');
        const res1 = await axios.get('https://otx.alienvault.com/api/v1/pulses/subscribed?limit=5', {
            headers: { 'X-OTX-API-KEY': key }
        });
        console.log('Subscribed Count:', res1.data.results ? res1.data.results.length : 0);

        if (!res1.data.results || res1.data.results.length === 0) {
            console.log('No subscribed pulses found. Trying Public Pulses...');
            // Try a public search if subscribed is empty (common for new accounts)
            const res2 = await axios.get('https://otx.alienvault.com/api/v1/search/pulses?q=malware&sort=-modified&limit=5', {
                headers: { 'X-OTX-API-KEY': key }
            });
            console.log('Public Search Count:', res2.data.results ? res2.data.results.length : 0);
            if (res2.data.results && res2.data.results.length > 0) {
                console.log('Sample Pulse:', res2.data.results[0].name);
            }
        } else {
            const firstPulse = res1.data.results[0];
            console.log('Sample Pulse:', firstPulse.name);
            if (firstPulse.indicators) {
                console.log('Indicators count:', firstPulse.indicators.length);
                console.log('first indicator type:', firstPulse.indicators[0].type);
                console.log('first indicator content:', firstPulse.indicators[0].indicator);
            } else {
                console.log('NO INDICATORS in this pulse!');
                // Check if there is an alternative property
                console.log('Pulse Keys:', Object.keys(firstPulse));
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.error('Status:', error.response.status, error.response.data);
    }
};

testAlienVault();
