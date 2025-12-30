import React, { useMemo } from 'react';

interface WeeklyHeatmapProps {
    demands: any[];
    className?: string;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const WeeklyHeatmap: React.FC<WeeklyHeatmapProps> = ({ demands, className = '' }) => {
    const heatmapData = useMemo(() => {
        // Initialize grid: 7 days x 24 hours
        const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
        let maxValue = 0;

        demands.forEach(d => {
            if (!d.created_at) return;
            const date = new Date(d.created_at);
            const day = date.getDay(); // 0-6
            const hour = date.getHours(); // 0-23
            grid[day][hour]++;
            if (grid[day][hour] > maxValue) maxValue = grid[day][hour];
        });

        return { grid, maxValue };
    }, [demands]);

    const getColor = (value: number): string => {
        if (value === 0) return 'bg-zinc-800/30';
        const intensity = value / (heatmapData.maxValue || 1);
        if (intensity < 0.25) return 'bg-primary/20';
        if (intensity < 0.5) return 'bg-primary/40';
        if (intensity < 0.75) return 'bg-primary/60';
        return 'bg-primary/90';
    };

    // Summarize best times
    const bestTimes = useMemo(() => {
        const times: { day: number; hour: number; count: number }[] = [];
        heatmapData.grid.forEach((dayData, day) => {
            dayData.forEach((count, hour) => {
                if (count > 0) times.push({ day, hour, count });
            });
        });
        times.sort((a, b) => b.count - a.count);
        return times.slice(0, 3);
    }, [heatmapData]);

    const formatHour = (hour: number) => {
        return `${hour.toString().padStart(2, '0')}h`;
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Compact Hour Labels (every 4 hours) */}
            <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                    {/* Hour labels */}
                    <div className="flex mb-1 pl-12">
                        {[0, 4, 8, 12, 16, 20].map(hour => (
                            <div key={hour} className="flex-1 text-xs text-zinc-500 text-left">
                                {formatHour(hour)}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="space-y-1">
                        {heatmapData.grid.map((dayData, dayIndex) => (
                            <div key={dayIndex} className="flex items-center gap-1">
                                <span className="w-10 text-xs text-zinc-500 text-right pr-2">
                                    {DAYS[dayIndex]}
                                </span>
                                <div className="flex gap-0.5 flex-1">
                                    {dayData.map((value, hourIndex) => (
                                        <div
                                            key={hourIndex}
                                            className={`flex-1 h-6 rounded-sm ${getColor(value)} transition-colors hover:ring-1 hover:ring-white/30 cursor-pointer`}
                                            title={`${DAYS[dayIndex]} ${formatHour(hourIndex)}: ${value} demandas`}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-end gap-2 mt-3">
                        <span className="text-xs text-zinc-500">Menos</span>
                        <div className="flex gap-0.5">
                            <div className="w-4 h-4 rounded-sm bg-zinc-800/30" />
                            <div className="w-4 h-4 rounded-sm bg-primary/20" />
                            <div className="w-4 h-4 rounded-sm bg-primary/40" />
                            <div className="w-4 h-4 rounded-sm bg-primary/60" />
                            <div className="w-4 h-4 rounded-sm bg-primary/90" />
                        </div>
                        <span className="text-xs text-zinc-500">Mais</span>
                    </div>
                </div>
            </div>

            {/* Best Times Summary */}
            {bestTimes.length > 0 && (
                <div className="bg-zinc-800/30 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wide">Horários de Pico</p>
                    <div className="flex flex-wrap gap-2">
                        {bestTimes.map((time, idx) => (
                            <span
                                key={idx}
                                className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded"
                            >
                                {DAYS[time.day]} {formatHour(time.hour)} ({time.count})
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeeklyHeatmap;
