import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface TopCountriesChartProps {
    data: { country: string; count: number }[];
}

const TopCountriesChart = ({ data }: TopCountriesChartProps) => {
    // Sort descending
    const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 10);

    return (
        <div className="soc-card h-[450px] flex flex-col">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Top Attacking Countries</h3>
                    <p className="text-sm text-muted-foreground">Geographic origin of threats</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        barCategoryGap={10}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="country"
                            type="category"
                            tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500 }}
                            width={30}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '8px',
                                color: 'hsl(var(--foreground))'
                            }}
                            cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} name="Attacks">
                            {sortedData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - (index * 0.08)})`} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TopCountriesChart;
