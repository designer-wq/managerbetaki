import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { AlertTriangle, Battery, BatteryCharging, BatteryFull, Calendar, TrendingUp } from 'lucide-react';
import { isStatusActive, isStatusCompleted } from '../../../lib/reports/metrics';

interface TeamReportTabProps {
    demands: any[];
}

const COLORS = ['#bcd200', '#60a5fa', '#f472b6', '#a78bfa', '#fbbf24', '#34d399', '#f87171', '#9ca3af'];

export const TeamReportTab: React.FC<TeamReportTabProps> = ({ demands }) => {

    const stats = useMemo(() => {
        const designerMap: Record<string, {
            activeCount: number;
            completedLast30d: number;
            future7: number;
            future14: number;
            future30: number;
            name: string;
            avatar_url?: string;
        }> = {};

        const now = new Date();
        const date7 = new Date(now); date7.setDate(now.getDate() + 7);
        const date14 = new Date(now); date14.setDate(now.getDate() + 14);
        const date30 = new Date(now); date30.setDate(now.getDate() + 30);
        const dateMinus30 = new Date(now); dateMinus30.setDate(now.getDate() - 30);

        // Normalize
        now.setHours(0, 0, 0, 0);
        date7.setHours(23, 59, 59, 999);
        date14.setHours(23, 59, 59, 999);
        date30.setHours(23, 59, 59, 999);

        let overlimitCount = 0;

        demands.forEach(d => {
            const desName = d.responsible?.name || 'Não atribuído';
            const s = d.statuses?.name || '';
            const isActive = isStatusActive(s);
            const isCompleted = isStatusCompleted(s); // Use helper

            if (!designerMap[desName]) {
                designerMap[desName] = {
                    activeCount: 0, completedLast30d: 0,
                    future7: 0, future14: 0, future30: 0,
                    name: desName, avatar_url: d.responsible?.avatar_url
                };
            }

            // Active Demands
            if (isActive) {
                designerMap[desName].activeCount++;

                // Future Checks
                if (d.deadline) {
                    const dead = new Date(d.deadline);
                    if (dead >= now) {
                        if (dead <= date7) designerMap[desName].future7++;
                        if (dead <= date14) designerMap[desName].future14++;
                        if (dead <= date30) designerMap[desName].future30++;
                    }
                }
            }

            // Historic Performance (approx velocity)
            if (isCompleted && d.updated_at) { // using updated_at as completion date proxy
                const compDate = new Date(d.updated_at);
                if (compDate >= dateMinus30) {
                    designerMap[desName].completedLast30d++;
                }
            }
        });

        // Convert and Calc Velocity
        const designers = Object.values(designerMap).filter(d => d.name !== 'Não atribuído').map(d => {
            // Dynamic Capacity: Based on actual delivery in last 30 days. 
            // Weekly Capacity ~= (Last 30 Days / 4).
            // Minimum floor of 5 to avoid div by zero or weird stats for new designers.
            const calculatedWeeklyCapacity = Math.ceil(d.completedLast30d / 4);
            const capacity = Math.max(calculatedWeeklyCapacity, 5); // Minimum 5

            const utilization = Math.round((d.activeCount / capacity) * 100);

            if (utilization >= 90) overlimitCount++;

            return {
                ...d,
                capacity,
                utilization,
                statusColor: utilization >= 90 ? '#ef4444' : utilization >= 70 ? '#f59e0b' : '#10b981'
            };
        }).sort((a, b) => b.utilization - a.utilization);

        return { designers, overlimitCount };
    }, [demands]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Alert Section */}
            {stats.overlimitCount > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-red-500/20 p-2 rounded-full text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-red-500 font-bold text-lg">Atenção: Sobrecarga Detectada</h3>
                        <p className="text-zinc-400 text-sm">{stats.overlimitCount} designer(s) estão operando acima de 90% da capacidade dinâmica. Redistribua tarefas.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Capacity Bars */}
                <div className="space-y-6">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <BatteryCharging className="text-primary" />
                        Ocupação Dinâmica (Baseada em entregas recentes)
                    </h3>
                    <div className="space-y-4">
                        {stats.designers.map(d => (
                            <div key={d.name} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
                                            {d.avatar_url ? (
                                                <img src={d.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-[10px] text-zinc-500">{d.name.slice(0, 2)}</div>
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-white font-bold text-sm block">{d.name}</span>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <span>{d.activeCount} ativas</span>
                                                <span>•</span>
                                                <span>Capacidade: ~{d.capacity}/sem</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span
                                        className="text-sm font-bold"
                                        style={{ color: d.statusColor }}
                                    >
                                        {d.utilization}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(d.utilization, 100)}%`, backgroundColor: d.statusColor }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-zinc-600">
                                    <span>0%</span>
                                    <span>Meta: 70%</span>
                                    <span>100% ({d.capacity} tasks)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Future Demand Chart */}
                <div className="card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col">
                    <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                        <TrendingUp className="text-blue-500" />
                        Previsão de Demanda (Próximos 30 dias)
                    </h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={stats.designers}
                                margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={1}
                                    tick={false} // Hide Y labels, we show avatar/name in legend or tooltip? Or just assume bars match left list
                                />
                                {/* Actually, showing names on Y axis is better */}
                                <YAxis
                                    yAxisId="left"
                                    dataKey="name"
                                    type="category"
                                    width={80}
                                    tick={{ fill: '#a1a1aa', fontSize: 10 }}
                                    interval={0}
                                />
                                <Tooltip
                                    cursor={{ fill: '#27272a' }}
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="future7" name="7 Dias" stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} barSize={20} />
                                <Bar dataKey="future14" name="14 Dias" stackId="a" fill="#818cf8" radius={[0, 0, 0, 0]} barSize={20} />
                                <Bar dataKey="future30" name="30 Dias" stackId="a" fill="#a78bfa" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-zinc-500 mt-4 text-center">
                        *Volume acumulado de demandas com data de entrega futura
                    </p>
                </div>
            </div>
        </div>
    );
};
