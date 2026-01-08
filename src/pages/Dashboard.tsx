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
import {
  generateThreats,
  generateAlerts,
  dashboardStats,
  Threat,
  Alert,
} from '@/data/mockData';

const Dashboard = () => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Initial load
    setThreats(generateThreats(50));
    setAlerts(generateAlerts(20));

    // Simulate real-time updates
    const interval = setInterval(() => {
      setAlerts((prev) => {
        const newAlert = generateAlerts(1)[0];
        return [newAlert, ...prev.slice(0, 19)];
      });
    }, 10000);

    return () => clearInterval(interval);
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
            value={dashboardStats.totalThreats}
            icon={Shield}
            trend={{ value: 12, isPositive: false }}
            variant="primary"
          />
          <StatCard
            title="Active Threats"
            value={dashboardStats.activeThreats}
            icon={Target}
            trend={{ value: 5, isPositive: false }}
            variant="destructive"
          />
          <StatCard
            title="Blocked Attacks"
            value={dashboardStats.blockedAttacks}
            icon={ShieldCheck}
            trend={{ value: 18, isPositive: true }}
            variant="accent"
          />
          <StatCard
            title="System Health"
            value={`${dashboardStats.systemHealth}%`}
            icon={Activity}
            variant="primary"
          />
          <StatCard
            title="Critical Alerts"
            value={dashboardStats.criticalAlerts}
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
            <AttackChart />
          </div>
          <AttackTypePie />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopSourcesTable />
          <SystemHealth />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
