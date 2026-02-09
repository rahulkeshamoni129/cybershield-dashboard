import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

const Analytics = () => {
  const { token } = useAuth();
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [vectors, setVectors] = useState<any[]>([]);
  const [attackers, setAttackers] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [severityData, setSeverityData] = useState<any>({ Low: 0, Medium: 0, High: 0, Critical: 0 });

  // Fetch initial analytics data
  useEffect(() => {
    if (!token) return;

    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        // Hourly trend
        if (data.trendData) {
          const formattedHourly = data.trendData.map((item: any) => ({
            hour: item.time,
            attacks: item.threats,
            blocked: Math.floor(item.threats * 0.7) // Simulate 70% blocked
          }));
          setHourlyData(formattedHourly);
        }

        // Attack vectors
        if (data.attacksByType) {
          const TYPE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
          const vectorsArray = Object.entries(data.attacksByType).map(([name, value], i) => ({
            name,
            value: Number(value),
            color: TYPE_COLORS[i % TYPE_COLORS.length]
          }));
          setVectors(vectorsArray);
        }

        // Top attackers
        if (data.topSources) {
          const total = Object.values(data.topSources).reduce((a: any, b: any) => a + b, 0) as number;
          const attackersArray = Object.entries(data.topSources).map(([country, count]) => ({
            country,
            attacks: Number(count),
            percentage: total > 0 ? Math.round((Number(count) / total) * 100) : 0
          })).sort((a, b) => b.attacks - a.attacks).slice(0, 5);
          setAttackers(attackersArray);
        }

        // Severity distribution for weekly view
        if (data.severityDistribution) {
          setSeverityData(data.severityDistribution);
        }

        // Use weekly trend data from API
        if (data.weeklyTrendData && data.weeklyTrendData.length > 0) {
          setWeeklyData(data.weeklyTrendData);
        }

        // Use monthly trend data from API
        if (data.monthlyTrendData && data.monthlyTrendData.length > 0) {
          setMonthlyData(data.monthlyTrendData);
        }

      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
    };

    fetchAnalytics();
  }, [token]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    const socket = io('/', {
      path: '/socket.io',
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('[Analytics] Socket connected:', socket.id);
    });

    socket.on('dashboard_stats', (data: any) => {
      console.log('[Analytics] Received dashboard_stats:', data);

      // Update attack vectors
      if (data.typeDistribution) {
        const TYPE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
        const distArray = Object.entries(data.typeDistribution).map(([name, value], index) => ({
          name,
          value: Number(value),
          color: TYPE_COLORS[index % 6]
        }));
        if (distArray.length > 0) setVectors(distArray);
      }

      // Update top attackers
      if (data.topSources) {
        console.log('[Analytics] Top sources:', data.topSources);
        const total = Object.values(data.topSources).reduce((a: any, b: any) => a + b, 0) as number;
        const sourcesArray = Object.entries(data.topSources).map(([country, count]) => ({
          country,
          attacks: Number(count),
          percentage: total > 0 ? Math.round((Number(count) / total) * 100) : 0
        })).sort((a, b) => b.attacks - a.attacks).slice(0, 5);

        if (sourcesArray.length > 0) {
          console.log('[Analytics] Setting attackers:', sourcesArray);
          setAttackers(sourcesArray);
        }
      }
    });

    socket.on('attack_event', (attack: any) => {
      console.log('[Analytics] Received attack_event:', attack.sourceCountry, attack.attackType);
      // Update hourly data for current hour
      const currentHour = new Date().getHours();
      setHourlyData(prev => {
        const updated = [...prev];
        const hourEntry = updated.find(h => h.hour === `${currentHour}:00`);
        if (hourEntry) {
          hourEntry.attacks += 1;
          hourEntry.blocked = Math.floor(hourEntry.attacks * 0.7);
        }
        return updated;
      });

      // Update top attackers immediately
      setAttackers(prev => {
        const updated = [...prev];
        const countryIndex = updated.findIndex(a => a.country === attack.sourceCountry);

        if (countryIndex !== -1) {
          // Country already in top 5, increment
          updated[countryIndex].attacks += 1;
        } else {
          // New country, add it
          updated.push({ country: attack.sourceCountry, attacks: 1, percentage: 0 });
        }

        // Recalculate percentages
        const total = updated.reduce((sum, a) => sum + a.attacks, 0);
        updated.forEach(a => {
          a.percentage = total > 0 ? Math.round((a.attacks / total) * 100) : 0;
        });

        // Sort and keep top 5
        return updated.sort((a, b) => b.attacks - a.attacks).slice(0, 5);
      });

      // Update attack vectors immediately
      setVectors(prev => {
        const updated = [...prev];
        const typeIndex = updated.findIndex(v => v.name === attack.attackType);

        if (typeIndex !== -1) {
          updated[typeIndex].value += 1;
        } else {
          const TYPE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
          updated.push({
            name: attack.attackType,
            value: 1,
            color: TYPE_COLORS[updated.length % TYPE_COLORS.length]
          });
        }

        return updated;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold gradient-text">Security Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive security metrics and trend analysis
          </p>
        </div>

        {/* Time Range Tabs */}
        <Tabs defaultValue="day" className="space-y-6">
          <TabsList>
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>

          <TabsContent value="day" className="space-y-6">
            {/* Hourly Attack Chart */}
            <Card className="soc-card">
              <CardHeader>
                <CardTitle>Hourly Attack Distribution (Real-time)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData}>
                      <defs>
                        <linearGradient id="attackGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="attacks"
                        stroke="hsl(var(--destructive))"
                        fill="url(#attackGradient)"
                        name="Attacks"
                        animationDuration={500}
                      />
                      <Area
                        type="monotone"
                        dataKey="blocked"
                        stroke="hsl(var(--accent))"
                        fill="url(#blockedGradient)"
                        name="Blocked"
                        animationDuration={500}
                      />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attack Vectors */}
              <Card className="soc-card">
                <CardHeader>
                  <CardTitle>Attack Vectors (Live)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie
                          data={vectors}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                          label={false}
                        >
                          {vectors.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                          formatter={(value: number) => [value, 'Count']}
                        />
                        <Legend
                          verticalAlign="middle"
                          align="right"
                          layout="vertical"
                          wrapperStyle={{ paddingRight: '20px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Attackers - Static for now but simulating real feel */}
              <Card className="soc-card">
                <CardHeader>
                  <CardTitle>Top Attack Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attackers.map((attacker, index) => (
                      <div key={attacker.country} className="flex items-center gap-4">
                        <span className="w-8 text-center font-bold text-muted-foreground">{index + 1}</span>
                        <span className="w-24 font-medium">{attacker.country}</span>
                        <div className="flex-1 h-8 bg-muted/30 rounded-lg overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-primary/80 to-primary"
                            style={{ width: `${attacker.percentage * 3}%` }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-mono">
                            {attacker.attacks.toLocaleString()}
                          </span>
                        </div>
                        <span className="w-16 text-right text-sm text-muted-foreground">
                          {attacker.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="week" className="space-y-6">
            <Card className="soc-card">
              <CardHeader><CardTitle>Weekly Trends (Data-Driven)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Legend />
                      <Bar dataKey="critical" name="Critical" fill="hsl(var(--critical))" stackId="a" />
                      <Bar dataKey="high" name="High" fill="hsl(var(--destructive))" stackId="a" />
                      <Bar dataKey="medium" name="Medium" fill="hsl(var(--warning))" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month" className="space-y-6">
            {/* Monthly Trend */}
            <Card className="soc-card">
              <CardHeader>
                <CardTitle>Monthly Threat Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="threats"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        name="Total Threats"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Analytics;
