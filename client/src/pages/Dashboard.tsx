import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import ThreatMap from '@/components/dashboard/ThreatMap';
import AlertFeed from '@/components/dashboard/AlertFeed';
import AttackChart from '@/components/dashboard/AttackChart';
import AttackTypePie from '@/components/dashboard/AttackTypePie';
import TopSourcesTable from '@/components/dashboard/TopSourcesTable';
import SystemHealth from '@/components/dashboard/SystemHealth';
import {
  Shield,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Target,
  Zap,
} from 'lucide-react';
import { io } from 'socket.io-client';
import {
  generateThreats,
  generateAlerts,
  dashboardStats,
  Threat,
  Alert,
  getCountryCoordinates,
  threatTrendData,
} from '@/data/mockData';

const Dashboard = () => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState(dashboardStats);
  const [typeDistribution, setTypeDistribution] = useState<{ name: string; value: number; color?: string }[]>([]);
  const [topSources, setTopSources] = useState<{ country: string; attacks: number }[]>([]);
  const [trendData, setTrendData] = useState<any[]>(threatTrendData);

  useEffect(() => {
    // Initial load
    setThreats(generateThreats(50));
    setAlerts(generateAlerts(20));

    // Connect to WebSocket
    const socket = io('/', {
      path: '/socket.io',
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to CyberShield Live Feed');
    });

    socket.on('dashboard_stats', (data: any) => {
      setStats(prev => ({
        ...prev,
        totalThreats: data.totalThreats,
        activeThreats: data.activeThreats,
        blockedAttacks: data.blockedAttacks,
        criticalAlerts: data.criticalAlerts,
        systemHealth: data.systemHealth
      }));

      // Transform distribution for Pie Chart
      const distArray = Object.keys(data.typeDistribution).map((key, index) => ({
        name: key,
        value: data.typeDistribution[key],
        color: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'][index % 6]
      }));
      setTypeDistribution(distArray);

      // Transform Top Sources for Table
      if (data.topSources) {
        const sourcesArray = Object.keys(data.topSources)
          .map(country => ({ country, attacks: data.topSources[country] }))
          .sort((a, b) => b.attacks - a.attacks)
          .slice(0, 5); // Top 5
        setTopSources(sourcesArray);
      }
    });

    socket.on('attack_event', (attack: any) => {
      const sourceCoords = getCountryCoordinates(attack.sourceCountry);
      const targetCoords = getCountryCoordinates(attack.destinationCountry);

      const newThreat: Threat = {
        id: attack.id,
        sourceCountry: attack.sourceCountry,
        targetCountry: attack.destinationCountry,
        type: attack.attackType,
        timestamp: new Date(attack.timestamp),
        status: 'active',
        sourceLat: sourceCoords[0],
        sourceLng: sourceCoords[1],
        targetLat: targetCoords[0],
        targetLng: targetCoords[1],
        severity: attack.severity,
        source: {
          ip: attack.ipFrom,
          country: attack.sourceCountry,
          lat: sourceCoords[0],
          lng: sourceCoords[1]
        },
        target: {
          ip: attack.ipTo,
          country: attack.destinationCountry,
          lat: targetCoords[0],
          lng: targetCoords[1]
        },
        mitreTactic: 'Initial Access',
        mitreId: 'T1078'
      };

      setThreats((prev) => [newThreat, ...prev].slice(0, 50));

      // Update Trend Data (Simulate real-time by adding to the last hour)
      setTrendData(prev => {
        const newData = [...prev];
        const lastIdx = newData.length - 1;
        const severityKey = attack.severity >= 9 ? 'critical' : attack.severity >= 7 ? 'high' : attack.severity >= 4 ? 'medium' : 'low';

        if (!newData[lastIdx][severityKey]) newData[lastIdx][severityKey] = 0;
        newData[lastIdx][severityKey]++;

        // Also fluctuate 'threats' count for visual effect if used
        if (!newData[lastIdx].threats) newData[lastIdx].threats = 0;
        newData[lastIdx].threats++;

        return newData;
      });

      // Also add an alert occasionally
      if (attack.severity > 7) {
        const newAlert: Alert = {
          id: `alert-${Date.now()}`,
          title: `${attack.attackType} from ${attack.sourceCountry}`,
          severity: 'critical',
          timestamp: new Date(),
          description: `High severity attack detected targeting ${attack.destinationCountry}`
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 20));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Security Operations Center</h1>
            <p className="text-muted-foreground mt-1">
              Real-time threat monitoring and analysis
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/30">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-accent font-medium">All Systems Operational</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Threats"
            value={stats.totalThreats}
            icon={Shield}
            trend={{ value: 12, isPositive: false }}
            variant="primary"
          />
          <StatCard
            title="Active Threats"
            value={stats.activeThreats}
            icon={Target}
            trend={{ value: 5, isPositive: false }}
            variant="destructive"
          />
          <StatCard
            title="Blocked Attacks"
            value={stats.blockedAttacks}
            icon={ShieldCheck}
            trend={{ value: 18, isPositive: true }}
            variant="accent"
          />
          <StatCard
            title="System Health"
            value={`${stats.systemHealth}%`}
            icon={Activity}
            variant="primary"
          />
          <StatCard
            title="Critical Alerts"
            value={stats.criticalAlerts}
            icon={AlertTriangle}
            variant="destructive"
          />
          <StatCard
            title="Events/min"
            value={Math.floor(Math.random() * 500) + 200}
            icon={Zap}
            variant="warning"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Threat Map - Takes 2 columns */}
          <div className="xl:col-span-2">
            <ThreatMap threats={threats} />
          </div>

          {/* Alert Feed */}
          <div className="xl:col-span-1">
            <AlertFeed alerts={alerts} />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <AttackChart data={trendData} />
          </div>
          <AttackTypePie data={typeDistribution} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopSourcesTable data={topSources} />
          <SystemHealth />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
