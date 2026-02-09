import React, { useMemo } from 'react';

interface RiskHeatmapProps {
    topCountries: { country: string; count: number }[];
    severityDistribution: { [key: string]: number };
    totalThreats: number;
}

const RiskHeatmap = ({ topCountries, severityDistribution, totalThreats }: RiskHeatmapProps) => {
    // Severity Levels: Critical, High, Medium, Low
    const severities = ['Critical', 'High', 'Medium', 'Low'];

    const { gridData, maxVal } = useMemo(() => {
        // Calculate percentages from global distribution to estimate local density
        // (In a real full-matrix query, we'd have exact numbers, but this approximates 
        // the "Risk Profile" assuming uniform distribution of attack types per actor for now)
        const totalSev = Object.values(severityDistribution).reduce((a, b) => a + b, 0) || 1;
        const sevPcts: Record<string, number> = {
            'Critical': (severityDistribution['Critical'] || 0) / totalSev,
            'High': (severityDistribution['High'] || 0) / totalSev,
            'Medium': (severityDistribution['Medium'] || 0) / totalSev,
            'Low': (severityDistribution['Low'] || 0) / totalSev,
        };

        let max = 0;
        const data = topCountries.slice(0, 8).map(countryData => {
            const rowValues = severities.map(sev => {
                const estimatedCount = Math.round(countryData.count * sevPcts[sev]);
                if (estimatedCount > max) max = estimatedCount;
                return estimatedCount;
            });
            return {
                country: countryData.country,
                values: rowValues
            };
        });

        return { gridData: data, maxVal: max || 1 };
    }, [topCountries, severityDistribution]);

    const getColor = (value: number) => {
        const intensity = value / maxVal; // 0 to 1
        if (intensity > 0.75) return 'bg-critical hover:bg-critical/90';
        if (intensity > 0.5) return 'bg-destructive hover:bg-destructive/90';
        if (intensity > 0.25) return 'bg-warning hover:bg-warning/90';
        return 'bg-secondary hover:bg-secondary/90';
    };

    const getOpacity = (value: number) => {
        // Map 0-max to 0.2-1 opacity
        return 0.2 + (0.8 * (value / maxVal));
    };



    return (
        <div className="soc-card h-auto p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold">Global Risk Matrix</h3>
                <p className="text-sm text-muted-foreground">Country vs. Severity Intensity Heatmap</p>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[400px]">
                    {/* Header Row */}
                    <div className="grid grid-cols-9 gap-2 mb-2">
                        <div className="col-span-1"></div> {/* Spacer for Y-axis labels */}
                        {gridData.map(d => (
                            <div key={d.country} className="text-center text-xs font-mono text-muted-foreground">
                                {d.country}
                            </div>
                        ))}
                    </div>

                    {/* Rows */}
                    {severities.map((sev, sIdx) => (
                        <div key={sev} className="grid grid-cols-9 gap-2 mb-2 items-center">
                            <div className="col-span-1 text-xs font-medium text-right pr-2 text-muted-foreground">{sev}</div>
                            {gridData.map((d, cIdx) => (
                                <div
                                    key={`${d.country}-${sev}`}
                                    className="aspect-square rounded-sm relative group cursor-pointer"
                                    title={`${d.country} - ${sev}: ${d.values[sIdx]} incidents`}
                                >
                                    <div
                                        className={`w-full h-full rounded-sm transition-all duration-300 ${getColor(d.values[sIdx])}`}
                                        style={{ opacity: getOpacity(d.values[sIdx]) }}
                                    />
                                    {/* Hover Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 border border-border shadow-md">
                                        {d.values[sIdx]} Events
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-end gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-secondary rounded-sm opacity-30"></div>Low</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-warning rounded-sm opacity-60"></div>Medium</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-destructive rounded-sm opacity-80"></div>High</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-critical rounded-sm opacity-100"></div>Critical</div>
            </div>
        </div>
    );
};

export default RiskHeatmap;
