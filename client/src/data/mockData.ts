

export interface Threat {
    id: string;
    sourceCountry: string;
    targetCountry: string;
    type: string;
    timestamp: Date;
    status: 'active' | 'blocked' | 'detecting';
    sourceLat: number;
    sourceLng: number;
    targetLat: number;
    targetLng: number;
    severity: number;
    // New nested structure for ThreatFeed
    source: {
        ip: string;
        country: string;
        lat: number;
        lng: number;
    };
    target: {
        ip: string;
        country: string;
        lat: number;
        lng: number;
    };
    mitreTactic?: string;
    mitreId?: string;
    dataSource?: string;
}

export interface Alert {
    id: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    description: string;
    source?: string;
    status?: 'new' | 'investigating' | 'resolved';
}

export const dashboardStats = {
    totalThreats: 14520,
    activeThreats: 42,
    blockedAttacks: 12405,
    systemHealth: 98,
    criticalAlerts: 3,
};

const COUNTRIES: Record<string, [number, number]> = {
    'US': [37.0902, -95.7129],
    'CN': [35.8617, 104.1954],
    'RU': [61.5240, 105.3188],
    'IN': [20.5937, 78.9629],
    'BR': [-14.2350, -51.9253],
    'DE': [51.1657, 10.4515],
    'UK': [55.3781, -3.4360],
    'GB': [55.3781, -3.4360], // United Kingdom
    'FR': [46.2276, 2.2137],
    'JP': [36.2048, 138.2529],
    'KR': [35.9078, 127.7669],
    'AU': [-25.2744, 133.7751],
    'CA': [56.1304, -106.3468],
    'NL': [52.1326, 5.2913], // Netherlands
    'SG': [1.3521, 103.8198], // Singapore
    'RO': [45.9432, 24.9668], // Romania
    'HK': [22.3193, 114.1694], // Hong Kong
    'ID': [-0.7893, 113.9213], // Indonesia
    'VN': [14.0583, 108.2772], // Vietnam
    'UA': [48.3794, 31.1656], // Ukraine
    'IT': [41.8719, 12.5674], // Italy
    'ES': [40.4637, -3.7492], // Spain
    'TW': [23.6978, 120.9605], // Taiwan
    'PL': [51.9194, 19.1451], // Poland
    'IR': [32.4279, 53.6880], // Iran
    'KP': [40.3399, 127.5101], // North Korea
    'TR': [38.9637, 35.2433], // Turkey
    'IL': [31.0461, 34.8516], // Israel
};

const ATTACK_TYPES = ['DDoS', 'SQL Injection', 'Brute Force', 'Malware', 'Phishing', 'XSS'];

export const generateThreats = (count: number): Threat[] => {
    return Array.from({ length: count }).map((_, i) => {
        const sourceCode = Object.keys(COUNTRIES)[Math.floor(Math.random() * Object.keys(COUNTRIES).length)];
        const targetCode = Object.keys(COUNTRIES)[Math.floor(Math.random() * Object.keys(COUNTRIES).length)];
        const sourceCoords = COUNTRIES[sourceCode];
        const targetCoords = COUNTRIES[targetCode];

        const sourceIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        const targetIP = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

        return {
            id: `threat-${i}-${Date.now()}`,
            sourceCountry: sourceCode,
            targetCountry: targetCode,
            type: ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)],
            timestamp: new Date(Date.now() - Math.random() * 3600000),
            status: Math.random() > 0.3 ? 'active' : 'blocked',
            severity: Math.floor(Math.random() * 10) + 1,
            sourceLat: sourceCoords[0],
            sourceLng: sourceCoords[1],
            targetLat: targetCoords[0],
            targetLng: targetCoords[1],
            source: {
                ip: sourceIP,
                country: sourceCode,
                lat: sourceCoords[0],
                lng: sourceCoords[1]
            },
            target: {
                ip: targetIP,
                country: targetCode,
                lat: targetCoords[0],
                lng: targetCoords[1]
            },
            mitreTactic: 'Initial Access',
            mitreId: 'T1078',
            dataSource: Math.random() > 0.5 ? 'AlienVault Reflected' : 'Mock Data'
        };
    });
};

export const generateAlerts = (count: number): Alert[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `alert-${i}-${Date.now()}`,
        title: `${ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)]} Detected`,
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        description: `Suspicious activity detected from IP 192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    }));
};

export const getCountryCoordinates = (code: string): [number, number] => {
    return COUNTRIES[code] || [0, 0];
};

export const countryCoords = COUNTRIES;

export const threatTrendData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    critical: Math.floor(Math.random() * 10),
    high: Math.floor(Math.random() * 20) + 5,
    medium: Math.floor(Math.random() * 30) + 10,
    low: Math.floor(Math.random() * 40) + 20,
    threats: Math.floor(Math.random() * 100) + 50,
}));

export const attackTypeDistribution = ATTACK_TYPES.map((type, index) => ({
    name: type,
    value: Math.floor(Math.random() * 1000) + 100,
    color: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'][index % 6]
}));

export const geoAttackData = Object.keys(COUNTRIES).slice(0, 5).map(code => ({
    country: code,
    attacks: Math.floor(Math.random() * 5000) + 1000,
    percentage: Math.floor(Math.random() * 100),
}));

export interface Incident {
    id: string;
    title: string;
    status: 'Open' | 'Investigating' | 'Resolved' | 'Closed';
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    assignee: string;
    created: Date;
    description: string;
    affectedAssets: string[];
    timeline: { action: string; user: string; timestamp: Date; note?: string }[];
}

export const generateIncidents = (count: number): Incident[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `INC-${1000 + i}`,
        title: `${ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)]} detected on Server ${i}`,
        status: ['Open', 'Investigating', 'Resolved'][Math.floor(Math.random() * 3)] as any,
        severity: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)] as any,
        assignee: 'Analyst',
        created: new Date(),
        description: `Automated alert for ${ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)]} activity.`,
        affectedAssets: [`Server-${i}`, 'Gateway'],
        timeline: []
    }));
}

export interface NetworkDevice {
    id: string;
    name: string;
    ip: string;
    status: 'online' | 'offline' | 'warning';
    type: 'server' | 'firewall' | 'router' | 'workstation' | 'switch';
    openPorts: number[];
    vulnerabilities: number;
    lastScan?: Date | string; // Optional because API might send string or not present
}

export const generateNetworkDevices = (count: number): NetworkDevice[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `dev-${i}`,
        name: `Device-${i}`,
        ip: `192.168.1.${i}`,
        status: ['online', 'offline', 'warning'][Math.floor(Math.random() * 3)] as any,
        type: ['server', 'firewall', 'router', 'workstation', 'switch'][Math.floor(Math.random() * 5)] as any, // Updated options
        openPorts: [],
        vulnerabilities: 0
    }));
}
