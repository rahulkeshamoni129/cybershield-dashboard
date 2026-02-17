import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import { Shield, Users, Activity, Lock, Database, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { isAdmin, token } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        users: 0,
        incidents: 0,
        cpuLoad: '0%',
        memory: '0%'
    });

    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
            return;
        }

        const fetchStats = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await fetch(`${apiUrl}/api/admin/system-health`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats({
                        users: data.userCount || 0,
                        incidents: data.incidentCount || 0,
                        cpuLoad: data.cpuLoad && data.cpuLoad[0] ? `${(data.cpuLoad[0] * 100).toFixed(1)}%` : '0%',
                        memory: data.memoryUsage ? `${((data.memoryUsage.heapUsed / data.memoryUsage.heapTotal) * 100).toFixed(1)}%` : 'N/A'
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
            <div className="space-y-6 animate-fade-in">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Users"
                        value={stats.users}
                        icon={Users}
                        variant="primary"
                    />
                    <StatCard
                        title="Active Incidents"
                        value={stats.incidents}
                        icon={AlertTriangle}
                        variant="destructive"
                    />
                    <StatCard
                        title="CPU Load"
                        value={stats.cpuLoad}
                        icon={Activity}
                        variant="accent"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Actions / Links */}
                    <div className="soc-card space-y-4">
                        <h3 className="text-xl font-semibold">Quick Actions</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <button onClick={() => navigate('/admin/users')} className="p-8 rounded-xl border border-border hover:bg-muted/50 transition-all hover:border-primary/50 group flex flex-col items-center gap-4">
                                <Users className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                                <span className="text-lg font-medium">Manage Users & Roles</span>
                                <p className="text-sm text-muted-foreground text-center">Add, remove, or change permissions for system users</p>
                            </button>
                        </div>
                    </div>

                    <div className="soc-card">
                        <h3 className="text-xl font-semibold mb-4">System Status</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                                <span className="text-muted-foreground">Server Status</span>
                                <span className="font-mono text-primary font-bold">Online</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                                <span className="text-muted-foreground">Database Connection</span>
                                <span className="font-mono text-accent">Connected</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                                <span className="text-muted-foreground">Memory Usage</span>
                                <span className="font-mono text-warning">{stats.memory}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default AdminDashboard;
