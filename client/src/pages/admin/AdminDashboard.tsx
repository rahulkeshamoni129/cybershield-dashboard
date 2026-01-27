import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import { Shield, Users, Activity, Lock, Database, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, isAdmin, token } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        users: 0,
        logs: 0,
        apiKeys: 0
    });

    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
            return;
        }

        // Fetch System Stats if API available
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/system-health', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Mocking some counts as data doesn't return count
                    setStats({
                        users: data.userCount || 0,
                        logs: 450,
                        apiKeys: 2
                    });
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchStats();
    }, [isAdmin, navigate, token]);

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-1">
                            System Administration & Control Panel
                        </p>
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary font-medium">
                        Admin Access Granted
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Users"
                        value={stats.users}
                        icon={Users}
                        variant="primary"
                    />
                    <StatCard
                        title="System Logs"
                        value={stats.logs}
                        icon={Database}
                        variant="default"
                    />
                    <StatCard
                        title="Active API Keys"
                        value={stats.apiKeys}
                        icon={Lock}
                        variant="accent"
                    />
                    <StatCard
                        title="Security Alerts"
                        value={5}
                        icon={AlertTriangle}
                        variant="destructive"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-64">
                    {/* Actions / Links */}
                    <div className="soc-card space-y-4">
                        <h3 className="text-xl font-semibold">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => navigate('/admin/users')} className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors flex flex-col items-center gap-2">
                                <Users className="h-6 w-6 text-primary" />
                                <span>Manage Users</span>
                            </button>
                            <button className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors flex flex-col items-center gap-2">
                                <Activity className="h-6 w-6 text-accent" />
                                <span>System Health</span>
                            </button>
                            <button className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors flex flex-col items-center gap-2">
                                <Database className="h-6 w-6 text-warning" />
                                <span>View Logs</span>
                            </button>
                            <button className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors flex flex-col items-center gap-2">
                                <Lock className="h-6 w-6 text-destructive" />
                                <span>API Keys</span>
                            </button>
                        </div>
                    </div>

                    <div className="soc-card">
                        <h3 className="text-xl font-semibold mb-4">System Status</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span>Server Uptime</span>
                                <span className="font-mono text-primary">99.9%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Database Connection</span>
                                <span className="font-mono text-accent">Connected</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Redis Cache</span>
                                <span className="font-mono text-accent">Connected</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Last Backup</span>
                                <span className="font-mono text-muted-foreground">2 hours ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default AdminDashboard;
