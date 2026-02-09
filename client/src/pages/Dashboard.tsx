import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import ThreatMap from '@/components/dashboard/ThreatMap';
import AlertFeed from '@/components/dashboard/AlertFeed';
import AttackChart from '@/components/dashboard/AttackChart';
import AttackTypePie from '@/components/dashboard/AttackTypePie';
import TopCountriesChart from '@/components/dashboard/TopCountriesChart';
import SeverityChart from '@/components/dashboard/SeverityChart';
import RiskHeatmap from '@/components/dashboard/RiskHeatmap';

import MitreAttackChart from '@/components/dashboard/MitreAttackChart';
import ConfidenceScoreChart from '@/components/dashboard/ConfidenceScoreChart';
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
} from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';

const Dashboard = () => {
  const { token } = useAuth();
  const [threats, setThreats] = useState<Threat[]>([]); // Real-time feed events
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({
    totalThreats: 0,
    activeThreats: 0,
    blockedAttacks: 0,
    systemHealth: 98,
    criticalAlerts: 0,
    globalRiskScore: 0
  });

  // Charts Data
  const [typeDistribution, setTypeDistribution] = useState<{ name: string; value: number; color?: string }[]>([]);
  const [topSources, setTopSources] = useState<{ country: string; count: number }[]>([]);
  const [trendData, setTrendData] = useState<{ time: string; threats: number }[]>([]);
  const [severityDist, setSeverityDist] = useState<{ name: string; value: number }[]>([]);
  const [mitreData, setMitreData] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [confidenceData, setConfidenceData] = useState<{ range: number; count: number }[]>([]);

  // Colors for charts
  const TYPE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Fetch Historical Data from Backend (API)
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        // 1. Core Stats
        setStats(prev => ({
          ...prev,
          totalThreats: data.totalAttacks || 0,
          globalRiskScore: data.globalRiskScore || 0,
          // Keep other simulated stats for liveness
          activeThreats: Math.floor(Math.random() * 20) + 5
        }));

        // 2. Trend Data
        if (data.trendData) {
          setTrendData(data.trendData);
        }

        // 3. Top Countries (Object -> Array)
        if (data.topSources) {
          const sources = Object.entries(data.topSources)
            .map(([country, count]) => ({ country, count: Number(count) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
          setTopSources(sources);
        }

        // 4. Attack Types (Object -> Array)
        if (data.attacksByType) {
          const types = Object.entries(data.attacksByType)
            .map(([name, value], i) => ({
              name,
              value: Number(value),
              color: TYPE_COLORS[i % TYPE_COLORS.length]
            }));
          setTypeDistribution(types);
        }

        // 5. Severity (Object -> Array)
        if (data.severityDistribution) {
          const sev = Object.entries(data.severityDistribution).map(([name, value]) => ({
            name,
            value: Number(value)
          }));
          setSeverityDist(sev);
        }

        // 6. MITRE Data (Array -> Array)
        if (data.mitreData) {
          setMitreData(data.mitreData);
        }

        // 7. Confidence Histogram (Array)
        if (data.confidenceHistogram) {
          setConfidenceData(data.confidenceHistogram);
        }

      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
    };

    fetchAnalytics();
  }, [token]);

  // Socket Connection for Real-Time Updates
  useEffect(() => {
    // Connect silently
    const socket = io('/', {
      path: '/socket.io',
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to CyberShield Live Feed');
    });

    socket.on('dashboard_stats', (data: any) => {
      // Merge Core Stats
      setStats(prev => ({
        ...prev,
        ...data,
        // Ensure we don't overwrite if not present
        totalThreats: data.totalThreats || prev.totalThreats,
        globalRiskScore: data.globalRiskScore || prev.globalRiskScore
      }));

      // Update incremental data mappings
      if (data.topSources) {
        const sources = Object.entries(data.topSources)
          .map(([country, count]) => ({ country, count: Number(count) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setTopSources(sources);
      }

      if (data.typeDistribution) {
        const types = Object.entries(data.typeDistribution)
          .map(([name, value], i) => ({
            name,
            value: Number(value),
            color: TYPE_COLORS[i % TYPE_COLORS.length]
          }));
        setTypeDistribution(types);
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

      // Update trend chart for current hour
      const currentHour = new Date().getHours();
      setTrendData(prev => {
        const updated = [...prev];
        const hourEntry = updated.find(t => t.time === `${currentHour}:00`);
        if (hourEntry) {
          hourEntry.threats += 1;
        }
        return updated;
      });

      // Increment top country count locally for instant feedback
      setTopSources(prev => {
        const newSources = [...prev];
        const idx = newSources.findIndex(s => s.country === attack.sourceCountry);
        if (idx !== -1) {
          newSources[idx].count += 1;
        } else {
          newSources.push({ country: attack.sourceCountry, count: 1 });
        }
        return newSources.sort((a, b) => b.count - a.count).slice(0, 10);
      });

      // Increment type distribution locally
      setTypeDistribution(prev => {
        const newTypes = [...prev];
        const typeName = attack.attackType || 'Unknown';
        const idx = newTypes.findIndex(t => t.name === typeName);
        if (idx !== -1) {
          newTypes[idx].value += 1;
        } else {
          newTypes.push({ name: typeName, value: 1, color: '#82ca9d' });
        }
        return newTypes;
      });

      // Alerts Logic
      if (attack.severity > 7) {
        const newAlert: Alert = {
          id: `alert-${Date.now()}`,
          title: `${attack.attackType} from ${attack.sourceCountry}`,
          severity: 'critical',
          timestamp: new Date(),
          description: `High severity attack detected targeting ${attack.destinationCountry}`,
          source: attack.ipFrom,
          status: 'new'
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
      <div className="space-y-6 pb-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Security Operations Center</h1>
            <p className="text-muted-foreground mt-1">
              Global Threat Intelligence & Analytics Dashboard
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
            >
              <Activity className="w-3 h-3" />
              Refresh Data
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/30">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-accent font-medium text-sm">Live Monitoring Active</span>
            </div>
          </div>
        </div>

        {/* 1. KPI Tiles (Heads-Up Display) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <StatCard title="Total Threats" value={stats.totalThreats.toLocaleString()} icon={Shield} trend={{ value: 12, isPositive: false }} variant="primary" />
          <StatCard title="Active Threats" value={stats.activeThreats} icon={Target} trend={{ value: 5, isPositive: false }} variant="destructive" />
          <StatCard title="Blocked Attacks" value={stats.blockedAttacks.toLocaleString()} icon={ShieldCheck} trend={{ value: 18, isPositive: true }} variant="accent" />
          <StatCard title="Global Risk Score" value={`${stats.globalRiskScore}/100`} icon={Activity} variant={stats.globalRiskScore > 50 ? "destructive" : "primary"} />
          <StatCard title="Critical Alerts" value={stats.criticalAlerts} icon={AlertTriangle} variant="destructive" />
          <StatCard title="Events/min" value={Math.floor(Math.random() * 500) + 200} icon={Zap} variant="warning" />
        </div>



        {/* 3. Global Threat Map: Full Width */}
        <div className="w-full">
          <ThreatMap threats={threats} />
        </div>

        {/* 3. Timeline: Full Width for Granularity */}
        <div className="h-[350px]">
          <AttackChart data={trendData} />
        </div>

        {/* 4. Analytics Grid: Categorical Breakdowns */}
        {/* 4. Analytics Grid: 2x2 Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[350px]">
            <AttackTypePie data={typeDistribution} />
          </div>
          <div className="h-[350px]">
            <SeverityChart distribution={severityDist} />
          </div>
          <div className="h-[350px]">
            <MitreAttackChart data={mitreData} />
          </div>
          <div className="h-[350px]">
            <ConfidenceScoreChart distribution={confidenceData} />
          </div>
        </div>

        {/* 5. Global Risk Matrix: Full Width */}
        <div className="w-full">
          <RiskHeatmap
            topCountries={topSources}
            severityDistribution={severityDist.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.value }), {})}
            totalThreats={stats.totalThreats}
          />
        </div>

        {/* 6. Real-Time Insights: Alerts & Sources (Moved to Bottom) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="h-full">
            <AlertFeed alerts={alerts} />
          </div>
          <div className="h-full">
            <TopCountriesChart data={topSources} />
          </div>
        </div>


      </div>
    </MainLayout>
  );
};

export default Dashboard;
