import React, { useMemo } from 'react';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { isStatusCompleted } from '../../../lib/reports/metrics';
import ReportAlerts from '../../../components/reports/ReportAlerts';

interface GeneralReportTabProps {
    demands: any[];
    dateRange?: { start: string; end: string };
}

const COLORS = ['#bcd200', '#60a5fa', '#f472b6', '#a78bfa', '#fbbf24', '#34d399', '#f87171', '#9ca3af'];

export const GeneralReportTab: React.FC<GeneralReportTabProps> = ({ demands, dateRange }) => {

    const stats = useMemo(() => {
        const total = demands.length;
        let completedCount = 0;
        let productionCount = 0;
        let revisionCount = 0;
        let backlogCount = 0;
        let delayedCount = 0; // "Atrasadas"
        let slaSum = 0; // Sum of Lead Time (days) for completed
        let slaCount = 0;

        let onTimeCount = 0;

        // Type Duration Stats
        const typeDurations: Record<string, { totalDays: number; count: number }> = {};

        // Origins
        const originsMap: Record<string, number> = {};

        // Statuses Snapshot
        const statusesMap: Record<string, number> = {};

        // Types Snapshot
        const typesMap: Record<string, number> = {};

        // Trend Data (Created vs Completed by Month)
        const trendMap: Record<string, { created: number; completed: number }> = {};

        const now = new Date();

        demands.forEach(d => {
            const s = d.statuses?.name?.toLowerCase() || '';
            const typeName = d.demand_types?.name || 'Outros';
            const originName = d.origins?.name || 'N/A';
            const isComp = isStatusCompleted(s);

            // --- Counters ---

            // 1. Status Snapshot
            statusesMap[d.statuses?.name || 'Sem Status'] = (statusesMap[d.statuses?.name || 'Sem Status'] || 0) + 1;

            // 2. Type Snapshot
            typesMap[typeName] = (typesMap[typeName] || 0) + 1;

            // 3. Origin Snapshot
            originsMap[originName] = (originsMap[originName] || 0) + 1;

            // 4. Grouping Counters
            if (isComp) {
                completedCount++;

                // SLA / Lead Time Calc
                const endDate = d.updated_at ? new Date(d.updated_at) : (d.finished_at ? new Date(d.finished_at) : new Date());
                const startDate = new Date(d.created_at);
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                slaSum += diffDays;
                slaCount++;

                // On Time Check
                if (d.deadline) {
                    const dead = new Date(d.deadline);
                    dead.setHours(23, 59, 59, 999);
                    if (endDate <= dead) onTimeCount++;
                } else {
                    onTimeCount++;
                }

                // Avg Time by Type
                if (!typeDurations[typeName]) typeDurations[typeName] = { totalDays: 0, count: 0 };
                typeDurations[typeName].totalDays += diffDays;
                typeDurations[typeName].count++;

                // Trend (Completed)
                const monthKey = endDate.toISOString().slice(0, 7); // YYYY-MM
                if (!trendMap[monthKey]) trendMap[monthKey] = { created: 0, completed: 0 };
                trendMap[monthKey].completed++;

            } else {
                // Active Demands Logic
                if (s.includes('produ') || s.includes('andamento') || s.includes('doing')) productionCount++;
                else if (s.includes('revis') || s.includes('altera')) revisionCount++;
                else if (s.includes('backlog') || s.includes('fila') || s.includes('pendente')) backlogCount++;

                // Delayed Logic (Past Deadline & Not Completed)
                if (d.deadline) {
                    const dead = new Date(d.deadline);
                    dead.setHours(23, 59, 59, 999);
                    if (now > dead) delayedCount++;
                }
            }

            // Trend (Created)
            if (d.created_at) {
                const monthKey = d.created_at.slice(0, 7); // YYYY-MM
                if (!trendMap[monthKey]) trendMap[monthKey] = { created: 0, completed: 0 };
                trendMap[monthKey].created++;
            }
        });

        const avgSla = slaCount > 0 ? (slaSum / slaCount).toFixed(1) : '0';
        const onTimePct = completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 100;
        const delayedPct = total > 0 ? Math.round((delayedCount / total) * 100) : 0;

        // Process Type Avg Times
        const typeTimeStats = Object.entries(typeDurations).map(([name, data]) => ({
            name,
            avgDays: Math.round(data.totalDays / data.count)
        })).sort((a, b) => b.avgDays - a.avgDays);

        // Process Charts
        const typeChartData = Object.entries(typesMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        const originChartData = Object.entries(originsMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        const statusChartData = Object.entries(statusesMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

        // Trend Chart (Sort by date)
        const trendChartData = Object.entries(trendMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-12) // Last 12 months
            .map(([date, data]) => {
                const [y, m] = date.split('-');
                const monthName = new Date(parseInt(y), parseInt(m) - 1).toLocaleString('pt-BR', { month: 'short' });
                return {
                    name: `${monthName}/${y.slice(2)}`,
                    Criadas: data.created,
                    Concluídas: data.completed
                };
            });

        return {
            total,
            completedCount,
            productionCount,
            revisionCount,
            backlogCount,
            delayedCount,
            avgSla,
            onTimePct,
            delayedPct,
            typeTimeStats,
            typeChartData,
            originChartData,
            statusChartData,
            trendChartData
        };
    }, [demands]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Alerts Section */}
            <ReportAlerts demands={demands} />

            {/* Strategic Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Strategic Indicators */}
                <div className="card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col justify-between">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary" />
                        Indicadores Estratégicos
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Entregues no Prazo</span>
                                <span className="text-emerald-500 font-bold">{stats.onTimePct}%</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.onTimePct}%` }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Taxa de Atraso Global</span>
                                <span className="text-red-500 font-bold">{stats.delayedPct}%</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-full rounded-full" style={{ width: `${stats.delayedPct}%` }} />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-800">
                            <p className="text-xs text-zinc-500 font-medium mb-3 uppercase tracking-wider">Tempo Médio por Tipo (Dias)</p>
                            <div className="grid grid-cols-2 gap-2">
                                {stats.typeTimeStats.slice(0, 6).map((t, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-800 text-xs">
                                        <span className="text-zinc-400 truncate max-w-[70%]">{t.name}</span>
                                        <span className="text-white font-bold">{t.avgDays}d</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trend Chart */}
                <div className="md:col-span-2 card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                        <Calendar size={20} className="text-primary" />
                        Criadas vs Concluídas (Últimos 12 Meses)
                    </h3>
                    <div className="w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.trendChartData}>
                                <defs>
                                    <linearGradient id="colorCriadas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorConcluidas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#bcd200" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#bcd200" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="name" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="Criadas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCriadas)" strokeWidth={2} />
                                <Area type="monotone" dataKey="Concluídas" stroke="#bcd200" fillOpacity={1} fill="url(#colorConcluidas)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Distribution by Type */}
                <div className="card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <h3 className="text-white font-bold text-md mb-6">Demandas por Tipo</h3>
                    <div className="w-full h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.typeChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {stats.typeChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <h3 className="text-white font-bold text-md mb-6">Status Atual</h3>
                    <div className="w-full h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={stats.statusChartData.slice(0, 8)} margin={{ top: 0, left: 40, right: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }} />
                                <Bar dataKey="value" fill="#60a5fa" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Origin Breakdown */}
                <div className="card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <h3 className="text-white font-bold text-md mb-6">Origem das Demandas</h3>
                    <div className="w-full h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.originChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }} />
                                <Bar dataKey="value" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
