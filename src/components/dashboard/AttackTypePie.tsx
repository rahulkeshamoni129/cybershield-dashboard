import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { attackTypeDistribution } from '@/data/mockData';

const AttackTypePie = () => {
  return (
    <div className="soc-card h-[300px]">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Attack Types</h3>
        <p className="text-sm text-muted-foreground">Distribution by category</p>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={attackTypeDistribution}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          >
            {attackTypeDistribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value}%`, 'Percentage']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttackTypePie;
