// Mock threat data for the SOC dashboard
export interface Threat {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: {
    ip: string;
    country: string;
    city: string;
    lat: number;
    lng: number;
  };
  target: {
    ip: string;
    country: string;
    city: string;
    lat: number;
    lng: number;
  };
  timestamp: Date;
  description: string;
  mitreTactic: string;
  mitreId: string;
  status: 'active' | 'mitigated' | 'investigating';
}

export interface Alert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  source: string;
  status: 'new' | 'acknowledged' | 'resolved';
}

export interface IPReputation {
  ip: string;
  score: number;
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  isBot: boolean;
  country: string;
  isp: string;
  reports: number;
  lastSeen: Date;
}

export interface NetworkDevice {
  id: string;
  name: string;
  ip: string;
  type: 'server' | 'workstation' | 'router' | 'firewall' | 'switch';
  status: 'online' | 'offline' | 'warning';
  lastScan: Date;
  openPorts: number[];
  vulnerabilities: number;
}

export interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignee: string;
  createdAt: Date;
  updatedAt: Date;
  description: string;
  affectedAssets: string[];
  timeline: {
    timestamp: Date;
    action: string;
    user: string;
  }[];
}

// Generate random IP
const randomIP = () => {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

// Country coordinates for attack visualization
export const countryCoords: Record<string, { lat: number; lng: number; city: string }> = {
  'Russia': { lat: 55.7558, lng: 37.6173, city: 'Moscow' },
  'China': { lat: 39.9042, lng: 116.4074, city: 'Beijing' },
  'North Korea': { lat: 39.0392, lng: 125.7625, city: 'Pyongyang' },
  'Iran': { lat: 35.6892, lng: 51.3890, city: 'Tehran' },
  'USA': { lat: 38.9072, lng: -77.0369, city: 'Washington DC' },
  'UK': { lat: 51.5074, lng: -0.1278, city: 'London' },
  'Germany': { lat: 52.5200, lng: 13.4050, city: 'Berlin' },
  'Brazil': { lat: -23.5505, lng: -46.6333, city: 'São Paulo' },
  'India': { lat: 28.6139, lng: 77.2090, city: 'New Delhi' },
  'Japan': { lat: 35.6762, lng: 139.6503, city: 'Tokyo' },
  'Australia': { lat: -33.8688, lng: 151.2093, city: 'Sydney' },
  'France': { lat: 48.8566, lng: 2.3522, city: 'Paris' },
  'Netherlands': { lat: 52.3676, lng: 4.9041, city: 'Amsterdam' },
  'Ukraine': { lat: 50.4501, lng: 30.5234, city: 'Kyiv' },
  'Singapore': { lat: 1.3521, lng: 103.8198, city: 'Singapore' },
};

const attackTypes = [
  'DDoS Attack',
  'SQL Injection',
  'Brute Force',
  'Phishing Campaign',
  'Ransomware',
  'Malware Infection',
  'Zero-Day Exploit',
  'Man-in-the-Middle',
  'Port Scan',
  'Credential Stuffing',
  'XSS Attack',
  'Command Injection',
];

const mitreTactics = [
  { tactic: 'Initial Access', id: 'TA0001' },
  { tactic: 'Execution', id: 'TA0002' },
  { tactic: 'Persistence', id: 'TA0003' },
  { tactic: 'Privilege Escalation', id: 'TA0004' },
  { tactic: 'Defense Evasion', id: 'TA0005' },
  { tactic: 'Credential Access', id: 'TA0006' },
  { tactic: 'Discovery', id: 'TA0007' },
  { tactic: 'Lateral Movement', id: 'TA0008' },
  { tactic: 'Collection', id: 'TA0009' },
  { tactic: 'Exfiltration', id: 'TA0010' },
];

const sourceCountries = ['Russia', 'China', 'North Korea', 'Iran', 'Brazil', 'India', 'Netherlands'];
const targetCountries = ['USA', 'UK', 'Germany', 'France', 'Japan', 'Australia', 'Singapore'];

// Generate mock threats
export const generateThreats = (count: number): Threat[] => {
  const threats: Threat[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const sourceCountry = sourceCountries[Math.floor(Math.random() * sourceCountries.length)];
    const targetCountry = targetCountries[Math.floor(Math.random() * targetCountries.length)];
    const mitre = mitreTactics[Math.floor(Math.random() * mitreTactics.length)];
    const severity = ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)] as Threat['severity'];
    
    threats.push({
      id: `THR-${String(i + 1).padStart(6, '0')}`,
      type: attackTypes[Math.floor(Math.random() * attackTypes.length)],
      severity,
      source: {
        ip: randomIP(),
        country: sourceCountry,
        city: countryCoords[sourceCountry].city,
        lat: countryCoords[sourceCountry].lat + (Math.random() - 0.5) * 5,
        lng: countryCoords[sourceCountry].lng + (Math.random() - 0.5) * 5,
      },
      target: {
        ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        country: targetCountry,
        city: countryCoords[targetCountry].city,
        lat: countryCoords[targetCountry].lat + (Math.random() - 0.5) * 2,
        lng: countryCoords[targetCountry].lng + (Math.random() - 0.5) * 2,
      },
      timestamp: new Date(now.getTime() - Math.random() * 86400000),
      description: `${attackTypes[Math.floor(Math.random() * attackTypes.length)]} detected from ${sourceCountry}`,
      mitreTactic: mitre.tactic,
      mitreId: mitre.id,
      status: ['active', 'mitigated', 'investigating'][Math.floor(Math.random() * 3)] as Threat['status'],
    });
  }
  
  return threats.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Generate mock alerts
export const generateAlerts = (count: number): Alert[] => {
  const alerts: Alert[] = [];
  const now = new Date();
  
  const alertTitles = [
    'Suspicious login attempt detected',
    'Firewall rule triggered',
    'Unusual outbound traffic',
    'Failed authentication spike',
    'Malware signature detected',
    'Port scan activity',
    'Data exfiltration attempt',
    'Privilege escalation detected',
    'Anomalous user behavior',
    'Certificate expiration warning',
  ];
  
  for (let i = 0; i < count; i++) {
    alerts.push({
      id: `ALT-${String(i + 1).padStart(6, '0')}`,
      title: alertTitles[Math.floor(Math.random() * alertTitles.length)],
      severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)] as Alert['severity'],
      timestamp: new Date(now.getTime() - Math.random() * 3600000),
      source: `sensor-${Math.floor(Math.random() * 10) + 1}.cybershield.local`,
      status: ['new', 'acknowledged', 'resolved'][Math.floor(Math.random() * 3)] as Alert['status'],
    });
  }
  
  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Generate mock network devices
export const generateNetworkDevices = (): NetworkDevice[] => {
  const devices: NetworkDevice[] = [
    {
      id: 'DEV-001',
      name: 'prod-web-01',
      ip: '10.0.1.10',
      type: 'server',
      status: 'online',
      lastScan: new Date(),
      openPorts: [22, 80, 443],
      vulnerabilities: 2,
    },
    {
      id: 'DEV-002',
      name: 'prod-db-01',
      ip: '10.0.1.20',
      type: 'server',
      status: 'online',
      lastScan: new Date(),
      openPorts: [22, 3306],
      vulnerabilities: 0,
    },
    {
      id: 'DEV-003',
      name: 'core-router-01',
      ip: '10.0.0.1',
      type: 'router',
      status: 'online',
      lastScan: new Date(),
      openPorts: [22, 161],
      vulnerabilities: 1,
    },
    {
      id: 'DEV-004',
      name: 'edge-firewall-01',
      ip: '10.0.0.254',
      type: 'firewall',
      status: 'online',
      lastScan: new Date(),
      openPorts: [22, 443],
      vulnerabilities: 0,
    },
    {
      id: 'DEV-005',
      name: 'ws-analyst-01',
      ip: '10.0.2.50',
      type: 'workstation',
      status: 'warning',
      lastScan: new Date(Date.now() - 86400000),
      openPorts: [22, 3389, 5900],
      vulnerabilities: 5,
    },
    {
      id: 'DEV-006',
      name: 'core-switch-01',
      ip: '10.0.0.2',
      type: 'switch',
      status: 'online',
      lastScan: new Date(),
      openPorts: [22, 161],
      vulnerabilities: 0,
    },
    {
      id: 'DEV-007',
      name: 'prod-app-01',
      ip: '10.0.1.30',
      type: 'server',
      status: 'offline',
      lastScan: new Date(Date.now() - 7200000),
      openPorts: [],
      vulnerabilities: 3,
    },
  ];
  
  return devices;
};

// Generate mock incidents
export const generateIncidents = (): Incident[] => {
  const incidents: Incident[] = [
    {
      id: 'INC-001',
      title: 'Ransomware Attack on Production Server',
      severity: 'critical',
      status: 'investigating',
      assignee: 'John Doe',
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(),
      description: 'Ransomware detected on prod-web-01. Files encrypted with .locked extension.',
      affectedAssets: ['prod-web-01', 'prod-db-01'],
      timeline: [
        { timestamp: new Date(Date.now() - 3600000), action: 'Incident created', user: 'System' },
        { timestamp: new Date(Date.now() - 3000000), action: 'Assigned to John Doe', user: 'Admin' },
        { timestamp: new Date(Date.now() - 2400000), action: 'Server isolated from network', user: 'John Doe' },
      ],
    },
    {
      id: 'INC-002',
      title: 'Suspicious Outbound Traffic',
      severity: 'high',
      status: 'open',
      assignee: 'Jane Smith',
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date(Date.now() - 1800000),
      description: 'Unusual data transfer detected to external IP 185.143.xx.xx',
      affectedAssets: ['ws-analyst-01'],
      timeline: [
        { timestamp: new Date(Date.now() - 7200000), action: 'Incident created', user: 'System' },
        { timestamp: new Date(Date.now() - 6600000), action: 'Assigned to Jane Smith', user: 'Admin' },
      ],
    },
    {
      id: 'INC-003',
      title: 'Multiple Failed Login Attempts',
      severity: 'medium',
      status: 'resolved',
      assignee: 'Mike Johnson',
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 43200000),
      description: 'Brute force attack detected against admin portal',
      affectedAssets: ['prod-web-01'],
      timeline: [
        { timestamp: new Date(Date.now() - 86400000), action: 'Incident created', user: 'System' },
        { timestamp: new Date(Date.now() - 82800000), action: 'IP blocked at firewall', user: 'Mike Johnson' },
        { timestamp: new Date(Date.now() - 43200000), action: 'Incident resolved', user: 'Mike Johnson' },
      ],
    },
  ];
  
  return incidents;
};

// Stats for dashboard
export const dashboardStats = {
  totalThreats: 1247,
  activeThreats: 23,
  blockedAttacks: 892,
  systemHealth: 94,
  criticalAlerts: 3,
  highAlerts: 12,
  mediumAlerts: 45,
  lowAlerts: 89,
};

// Attack type distribution
export const attackTypeDistribution = [
  { name: 'DDoS', value: 35, color: 'hsl(0, 84%, 55%)' },
  { name: 'Malware', value: 25, color: 'hsl(330, 81%, 55%)' },
  { name: 'Phishing', value: 20, color: 'hsl(38, 92%, 50%)' },
  { name: 'Brute Force', value: 12, color: 'hsl(217, 91%, 60%)' },
  { name: 'Other', value: 8, color: 'hsl(185, 100%, 50%)' },
];

// Threat trend data (last 7 days)
export const threatTrendData = [
  { day: 'Mon', critical: 5, high: 12, medium: 25, low: 45 },
  { day: 'Tue', critical: 8, high: 15, medium: 30, low: 52 },
  { day: 'Wed', critical: 3, high: 10, medium: 22, low: 38 },
  { day: 'Thu', critical: 12, high: 22, medium: 35, low: 60 },
  { day: 'Fri', critical: 6, high: 18, medium: 28, low: 48 },
  { day: 'Sat', critical: 2, high: 8, medium: 15, low: 25 },
  { day: 'Sun', critical: 3, high: 10, medium: 18, low: 30 },
];

// Geographic attack sources
export const geoAttackData = [
  { country: 'Russia', attacks: 342 },
  { country: 'China', attacks: 289 },
  { country: 'USA', attacks: 156 },
  { country: 'Brazil', attacks: 98 },
  { country: 'India', attacks: 87 },
  { country: 'Iran', attacks: 76 },
  { country: 'North Korea', attacks: 54 },
];
