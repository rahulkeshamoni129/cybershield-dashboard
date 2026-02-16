const axios = require('axios');

/**
 * Service to keep the AI Engine (and potentially the backend itself) alive
 * by sending periodic ping requests.
 */
const startKeepAlive = () => {
    const AI_ENGINE_URL = process.env.AI_ENGINE_URL;

    if (!AI_ENGINE_URL) {
        console.warn('KeepAlive: AI_ENGINE_URL is not set. Skipping keep-alive pings.');
        return;
    }

    // Function to ping the AI Engine
    const pingAIEngine = async () => {
        try {
            // Standard health check endpoint
            const target = `${AI_ENGINE_URL}/health`;
            // Using a short timeout to fail fast if it's really down, but long enough for cold start
            await axios.get(target, { timeout: 10000 });
            // console.log(`KeepAlive: Successfully pinged AI Engine at ${target}`);
        } catch (error) {
            // Only log errors if necessary, to avoid log spam
            // console.error(`KeepAlive: Failed to ping AI Engine. It might be waking up. Error: ${error.message}`);
        }
    };

    // 1. Initial Ping on Startup (to wake it up immediately)
    console.log(`KeepAlive: Sending initial wake-up call to AI Engine at ${AI_ENGINE_URL}...`);
    pingAIEngine();

    // 2. Schedule Periodic Pings (every 5 minutes)
    // Render/Heroku free tiers often sleep after 15 mins of inactivity.
    // 5 minutes (300000 ms) is a safe interval.
    const INTERVAL_MS = 5 * 60 * 1000;

    setInterval(pingAIEngine, INTERVAL_MS);
    console.log(`KeepAlive: Scheduled ping every ${INTERVAL_MS / 60000} minutes.`);
};

module.exports = { startKeepAlive };
