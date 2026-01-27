import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { threatTrendData } from '@/data/mockData';

interface AttackChartProps {
  data?: any[];
}

const AttackChart = ({ data }: AttackChartProps) => {
  const chartData = data && data.length > 0 ? data : threatTrendData;
  return (
    <div className="soc-card h-[300px]">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Threat Trend</h3>
        <p className="text-sm text-muted-foreground">Last 24 hours by severity</p>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={chartData} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          <Bar
            dataKey="critical"
            name="Critical"
            fill="hsl(var(--critical))"
            radius={[4, 4, 0, 0]}
            stackId="stack"
          />
          <Bar
            dataKey="high"
            name="High"
            fill="hsl(var(--destructive))"
            radius={[0, 0, 0, 0]}
            stackId="stack"
          />
          <Bar
            dataKey="medium"
            name="Medium"
            fill="hsl(var(--warning))"
            radius={[0, 0, 0, 0]}
            stackId="stack"
          />
          <Bar
            dataKey="low"
            name="Low"
            fill="hsl(var(--info))"
            radius={[0, 0, 4, 4]}
            stackId="stack"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttackChart;
