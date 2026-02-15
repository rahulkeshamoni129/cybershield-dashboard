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

interface ConfScoreChartProps {
    scores?: number[]; // Array of scores 0-100 (Legacy)
    distribution?: { range: number; count: number }[]; // Pre-aggregated (New)
}

const ConfidenceScoreChart = ({ scores, distribution }: ConfScoreChartProps) => {
    // Bucket scores into deciles (0-20, 20-40, 40-60, 60-80, 80-100)
    const buckets = Array.from({ length: 5 }, (_, i) => ({
        name: `${i * 20}-${(i + 1) * 20}`,
        count: 0
    }));

    if (distribution) {
        // Aggregate 10-step backend buckets into 20-step chart buckets
        distribution.forEach(d => {
            const idx = Math.min(4, Math.floor(d.range / 20));
            if (buckets[idx]) buckets[idx].count += d.count;
        });
    } else if (scores && scores.length > 0) {
        scores.forEach(s => {
            const idx = Math.min(4, Math.floor(s / 20));
            if (buckets[idx]) buckets[idx].count++;
        });
    }

    // Colors: Green to Red
    const COLORS = [
        'hsl(var(--accent))', // 0-20 (Safe-ish)
        'hsl(var(--info))',   // 20-40
        'hsl(var(--warning))', // 40-60
        'hsl(var(--destructive))', // 60-80
        'hsl(var(--critical))'  // 80-100
    ];

    return (
        <div className="soc-card h-full min-h-[250px] flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Threat Confidence</h3>
                <p className="text-sm text-muted-foreground">AbuseIPDB Score Distribution</p>
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={buckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
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
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Events">
                            {buckets.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                            <LabelList dataKey="count" position="top" style={{ fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 'bold' }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ConfidenceScoreChart;
