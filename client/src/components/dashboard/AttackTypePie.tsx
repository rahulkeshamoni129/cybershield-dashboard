import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface AttackTypePieProps {
  data: { name: string; value: number }[];
}

const COLORS = [
  '#A855F7', // Vivid Purple
  '#3B82F6', // Bright Blue
  '#10B981', // Emerald Green
  '#F97316', // Sunset Orange
  '#EAB308', // Lemon Yellow
  '#EC4899', // Hot Pink
  '#06B6D4', // Cyan
  '#EF4444', // Crimson Red
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F59E0B', // Amber
  '#475569'  // Deep Slate
];

const AttackTypePie = ({ data }: AttackTypePieProps) => {
  return (
    <div className="soc-card h-full min-h-[250px] flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Attack Vectors</h3>
        <p className="text-sm text-muted-foreground">Distribution by attack type</p>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              minAngle={15}
              dataKey="value"
            >
              {data.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || COLORS[index % COLORS.length]}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              wrapperStyle={{ color: 'hsl(var(--foreground))', fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttackTypePie;
