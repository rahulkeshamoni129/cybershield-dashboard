import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts';

interface SeverityChartProps {
    distribution: { name: string; value: number }[];
}

const SeverityChart = ({ distribution }: SeverityChartProps) => {
    // Color mapping matching CSS variables
    const getColor = (name: string) => {
        switch (name.toLowerCase()) {
            case 'critical': return 'hsl(var(--critical))';
            case 'high': return 'hsl(var(--destructive))';
            case 'medium': return 'hsl(var(--warning))';
            case 'low': return 'hsl(var(--info))';
            default: return 'hsl(var(--muted))';
        }
    };

    const sortedData = [...distribution].sort((a, b) => {
        const order = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        return (order[b.name as keyof typeof order] || 0) - (order[a.name as keyof typeof order] || 0);
    });

    return (
        <div className="soc-card h-full min-h-[250px] flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Severity Distribution</h3>
                <p className="text-sm text-muted-foreground">Risk classification breakdown</p>
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sortedData} layout="horizontal" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            hide
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '8px',
                                color: 'hsl(var(--foreground))'
                            }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1000}>
                            {sortedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                            ))}
                            <LabelList dataKey="value" position="top" style={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 'bold' }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SeverityChart;
