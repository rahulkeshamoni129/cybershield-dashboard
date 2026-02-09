const { spawn } = require('child_process');
const dns = require('dns');

// Validation regex for private IPs and localhost
// Validation regex for private IPs and localhost
const isPrivateIP = (ip) => {
    if (ip === 'localhost') return true;

    const parts = ip.split('.');
    if (parts.length !== 4) return false;

    const nums = parts.map(n => parseInt(n, 10));
    if (nums.some(n => isNaN(n) || n < 0 || n > 255)) return false;

    const [first, second] = nums;

    if (first === 127) return true;
    if (first === 10) return true;
    if (first === 192 && second === 168) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;

    return false;
};

// Check if string is a CIDR range
const isCIDR = (target) => {
    const parts = target.split('/');
    if (parts.length !== 2) return false;

    const ip = parts[0];
    const mask = parseInt(parts[1], 10);

    if (!isPrivateIP(ip)) return false;

    // Allow only /24 or smaller networks for safety
    if (mask < 24 || mask > 32) return false;

    return true;
};

const scan = (target, onDeviceFound, onComplete, onError) => {
    // 1. Validation
    if (!target) target = '127.0.0.1'; // Default to localhost

    // If target is just an IP, check it. If CIDR, check base IP.
    let isValid = false;
    if (target.includes('/')) {
        isValid = isCIDR(target);
    } else {
        isValid = isPrivateIP(target);
    }

    if (!isValid) {
        if (onError) onError('Invalid target. Only private IPs (192.168.x.x, 10.x.x.x) and localhost are allowed.');
        return;
    }

    console.log(`Starting Nmap scan on: ${target}`);

    // 2. Spawn Nmap Process
    // -sn : Ping Scan - disable port scan
    // -oG - : Grepable output to stdout
    const nmapResults = [];
    let nmap;
    let scanFinished = false;

    const finishScan = (data, isError = false) => {
        if (scanFinished) return;
        scanFinished = true;
        if (isError) {
            if (onError) onError(data);
        } else {
            if (onComplete) onComplete(data);
        }
    };

    try {
        nmap = spawn('nmap', ['-sn', '-oG', '-', target]);
    } catch (e) {
        console.log('Nmap spawn sync error, falling back to JS scan');
        fallbackScan(target, onDeviceFound, finishScan);
        return;
    }

    nmap.stdout.on('data', (data) => {
        const output = data.toString();
        const lines = output.split('\n');
        lines.forEach(line => {
            if (line.startsWith('Host:')) {
                const ipMatch = line.match(/Host: ([0-9.]+)/);
                const ip = ipMatch ? ipMatch[1] : null;
                const isUp = line.includes('Status: Up');

                if (ip && isUp) {
                    const device = {
                        id: `scan-${ip}`,
                        name: `Device (${ip})`,
                        ip: ip,
                        type: 'workstation',
                        status: 'online',
                        openPorts: [],
                        vulnerabilities: 0,
                        lastScan: new Date()
                    };

                    nmapResults.push(device);
                    if (onDeviceFound) onDeviceFound(device);
                }
            }
        });
    });

    nmap.stderr.on('data', (data) => {
        // console.error(`Nmap Error: ${data}`);
    });

    nmap.on('close', (code) => {
        if (code !== 0 && nmapResults.length === 0 && !scanFinished) {
            // If it failed and we haven't found anything, try fallback or error
            // Check if it's already handled by error event
        } else {
            finishScan(nmapResults);
        }
    });

    nmap.on('error', (err) => {
        if (scanFinished) return;
        console.error('Failed to start nmap process:', err.code);
        if (err.code === 'ENOENT') {
            console.log('Nmap not found in PATH. Switching to fallback JS scanner...');
            fallbackScan(target, onDeviceFound, finishScan);
        } else {
            finishScan('Failed to execute Nmap.', true);
        }
    });
};


const net = require('net');

// Fallback JS Scanner (Simple TCP Connect Scan)
const fallbackScan = async (target, onDeviceFound, onComplete) => {
    console.log('Starting Fallback JS Scan...');

    // Parse CIDR to get base
    // Support single IP or /24
    let ipsToScan = [];

    if (target.includes('/')) {
        const [baseIp, mask] = target.split('/');
        const parts = baseIp.split('.');
        const prefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
        // Scan .1 to .254
        for (let i = 1; i < 255; i++) {
            ipsToScan.push(`${prefix}.${i}`);
        }
    } else {
        ipsToScan.push(target);
    }

    const results = [];
    const BATCH_SIZE = 20;

    // Scan in batches to avoid choking the event loop
    for (let i = 0; i < ipsToScan.length; i += BATCH_SIZE) {
        const batch = ipsToScan.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(ip => checkHost(ip, (device) => {
            results.push(device);
            if (onDeviceFound) onDeviceFound(device);
        })));
    }

    if (onComplete) onComplete(results);
};

const checkHost = (ip, callback) => {
    return new Promise((resolve) => {
        // Try common ports to detect "online" status
        const PORTS_TO_CHECK = [80, 443, 135, 445, 22];
        let responded = false;
        let checks = 0;

        const done = () => {
            checks++;
            if (checks === PORTS_TO_CHECK.length) {
                resolve();
            }
        };

        PORTS_TO_CHECK.forEach(port => {
            if (responded) return done();

            const socket = new net.Socket();
            socket.setTimeout(400); // Fast timeout

            socket.on('connect', () => {
                if (!responded) {
                    responded = true;
                    socket.destroy();

                    // Found!
                    callback({
                        id: `scan-${ip}`,
                        name: `Device (${ip})`,
                        ip: ip,
                        type: port === 135 || port === 445 ? 'workstation' : 'server', // Simple guess
                        status: 'online',
                        openPorts: [port], // We found at least one
                        vulnerabilities: 0,
                        lastScan: new Date()
                    });
                }
                resolve();
            });

            socket.on('timeout', () => {
                socket.destroy();
                done();
            });

            socket.on('error', (e) => {
                socket.destroy();
                done();
            });

            socket.connect(port, ip);
        });
    });
};

const detectDeviceType = (ports) => {
    if (ports.includes(80) || ports.includes(443)) return 'server';
    if (ports.includes(3389) || ports.includes(22)) return 'workstation';
    if (ports.includes(53)) return 'router';
    return 'workstation';
};

module.exports = { scan };
