import {
    RadialBarChart,
    RadialBar,
    Legend,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface MitreChartProps {
    data: { name: string; value: number; fill: string }[];
}

const style = {
    top: '50%',
    right: 0,
    transform: 'translate(0, -50%)',
    lineHeight: '24px',
};

const MitreAttackChart = ({ data }: MitreChartProps) => {
    // If no data, show a placeholder but don't break
    const chartData = data && data.length > 0 ? data : [{ name: 'Collecting Data', value: 100, fill: '#333' }];

    return (
        <div className="soc-card h-full min-h-[250px] flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Threat Lifecycle Analysis</h3>
                <p className="text-sm text-muted-foreground">MITRE ATT&CK Framework Mapping</p>
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="40%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={10} data={chartData}>
                        <RadialBar
                            label={{ position: 'insideStart', fill: '#fff', fontSize: '10px' }}
                            background
                            dataKey="value"
                            cornerRadius={5}
                        />
                        <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={style} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MitreAttackChart;
