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

// Mock data for analytics
const hourlyAttacks = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  attacks: Math.floor(Math.random() * 100) + 20,
  blocked: Math.floor(Math.random() * 80) + 10,
}));

const weeklyTrend = [
  { day: 'Mon', critical: 12, high: 45, medium: 120, low: 230 },
  { day: 'Tue', critical: 8, high: 52, medium: 98, low: 210 },
  { day: 'Wed', critical: 15, high: 38, medium: 145, low: 195 },
  { day: 'Thu', critical: 22, high: 65, medium: 110, low: 280 },
  { day: 'Fri', critical: 18, high: 48, medium: 130, low: 245 },
  { day: 'Sat', critical: 5, high: 22, medium: 65, low: 120 },
  { day: 'Sun', critical: 3, high: 18, medium: 55, low: 95 },
];

const attackVectors = [
  { name: 'Web Application', value: 35, color: 'hsl(var(--primary))' },
  { name: 'Network', value: 28, color: 'hsl(var(--destructive))' },
  { name: 'Email', value: 22, color: 'hsl(var(--warning))' },
  { name: 'Endpoint', value: 15, color: 'hsl(var(--info))' },
];

const topAttackers = [
  { country: 'Russia', attacks: 2450, percentage: 28 },
  { country: 'China', attacks: 1890, percentage: 22 },
  { country: 'USA', attacks: 1230, percentage: 14 },
  { country: 'Brazil', attacks: 890, percentage: 10 },
  { country: 'India', attacks: 756, percentage: 9 },
];

const monthlyData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  threats: Math.floor(Math.random() * 500) + 100,
  incidents: Math.floor(Math.random() * 20) + 5,
}));

const Analytics = () => {
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
        <Tabs defaultValue="week" className="space-y-6">
          <TabsList>
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>

          <TabsContent value="day" className="space-y-6">
            {/* Hourly Attack Chart */}
            <Card className="soc-card">
              <CardHeader>
                <CardTitle>Hourly Attack Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyAttacks}>
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
                      />
                      <Area
                        type="monotone"
                        dataKey="blocked"
                        stroke="hsl(var(--accent))"
                        fill="url(#blockedGradient)"
                        name="Blocked"
                      />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="week" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Severity Distribution */}
              <Card className="soc-card">
                <CardHeader>
                  <CardTitle>Threats by Severity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
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
                        <Bar dataKey="critical" name="Critical" fill="hsl(var(--critical))" stackId="a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="high" name="High" fill="hsl(var(--destructive))" stackId="a" />
                        <Bar dataKey="medium" name="Medium" fill="hsl(var(--warning))" stackId="a" />
                        <Bar dataKey="low" name="Low" fill="hsl(var(--info))" stackId="a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Attack Vectors */}
              <Card className="soc-card">
                <CardHeader>
                  <CardTitle>Attack Vectors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={attackVectors}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {attackVectors.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Attackers */}
            <Card className="soc-card">
              <CardHeader>
                <CardTitle>Top Attack Sources by Country</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topAttackers.map((attacker, index) => (
                    <div key={attacker.country} className="flex items-center gap-4">
                      <span className="w-8 text-center font-bold text-muted-foreground">{index + 1}</span>
                      <span className="w-24 font-medium">{attacker.country}</span>
                      <div className="flex-1 h-8 bg-muted/30 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
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
                      <Line
                        type="monotone"
                        dataKey="incidents"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                        dot={false}
                        name="Incidents"
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
