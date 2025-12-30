import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Lightbulb, Tag, Globe, AlertCircle, Clock } from 'lucide-react';
import { isStatusCompleted } from '../../../lib/reports/metrics';

interface InsightsReportTabProps {
    demands: any[];
}

const COLORS = ['#bcd200', '#60a5fa', '#f472b6', '#a78bfa', '#fbbf24', '#34d399', '#f87171', '#9ca3af'];

export const InsightsReportTab: React.FC<InsightsReportTabProps> = ({ demands }) => {

    const stats = useMemo(() => {
        // Data Structures
        const byType: Record<string, {
            count: number;
            totalDurationDays: number;
            delayCount: number;
            completedCount: number;
        }> = {};

        const byOrigin: Record<string, {
            count: number;
            delayCount: number; // For "SLA por origem" (inverse of on-time)
            completedCount: number;
            totalDurationDays: number;
        }> = {};

        const now = new Date();

        demands.forEach(d => {
            const typeName = d.demand_types?.name || 'Outros';
            const originName = d.origins?.name || 'N/A';
            const isComp = isStatusCompleted(d.statuses?.name);

            // Init Type
            if (!byType[typeName]) byType[typeName] = { count: 0, totalDurationDays: 0, delayCount: 0, completedCount: 0 };
            byType[typeName].count++;

            // Init Origin
            if (!byOrigin[originName]) byOrigin[originName] = { count: 0, delayCount: 0, completedCount: 0, totalDurationDays: 0 };
            byOrigin[originName].count++;

            // Duration & Completion
            if (isComp) {
                byType[typeName].completedCount++;
                byOrigin[originName].completedCount++;

                const start = d.created_at ? new Date(d.created_at) : null;
                const end = d.updated_at ? new Date(d.updated_at) : (d.finished_at ? new Date(d.finished_at) : null);

                if (start && end) {
                    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    byType[typeName].totalDurationDays += diffDays;
                    byOrigin[originName].totalDurationDays += diffDays;
                }
            }

            // Checks for Delays (Completed Late OR Open Late)
            let isDelayed = false;
            if (d.deadline) {
                const deadline = new Date(d.deadline);
                deadline.setHours(23, 59, 59, 999);

                const checkDate = isComp && d.updated_at ? new Date(d.updated_at) : now;
                if (isComp && d.updated_at) checkDate.setHours(0, 0, 0, 0); // normalize if strictly date checking

                if (checkDate > deadline) isDelayed = true;
            }

            if (isDelayed) {
                byType[typeName].delayCount++;
                byOrigin[originName].delayCount++;
            }
        });

        // --- Process Type Stats ---
        const typeStats = Object.entries(byType).map(([name, data]) => ({
            name,
            count: data.count,
            avgTime: data.completedCount > 0 ? (data.totalDurationDays / data.completedCount).toFixed(1) : '0',
            delayRate: data.count > 0 ? Math.round((data.delayCount / data.count) * 100) : 0,
            delayCount: data.delayCount
        })).sort((a, b) => b.count - a.count);

        // --- Process Origin Stats ---
        const totalDemands = Object.values(byOrigin).reduce((acc, val) => acc + val.count, 0);

        const originStats = Object.entries(byOrigin).map(([name, data]) => ({
            name,
            count: data.count,
            sharePercentage: totalDemands > 0 ? Math.round((data.count / totalDemands) * 100) : 0,
            delayRate: data.count > 0 ? Math.round((data.delayCount / data.count) * 100) : 0,
            slaCompliance: data.count > 0 ? (100 - Math.round((data.delayCount / data.count) * 100)) : 100
        })).sort((a, b) => b.count - a.count);

        return { typeStats, originStats };
    }, [demands]);

    // Top Bottleneck (Type with most delays)
    const topDelayType = [...stats.typeStats].sort((a, b) => b.delayCount - a.delayCount)[0];
    const topSlowType = [...stats.typeStats].sort((a, b) => parseFloat(b.avgTime) - parseFloat(a.avgTime))[0];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Insights Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topDelayType && (
                    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl flex items-start gap-4">
                        <div className="bg-red-500/20 p-3 rounded-full text-red-500">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h3 className="text-red-500 font-bold text-lg">Gargalo de Atrasos</h3>
                            <p className="text-zinc-300 text-sm mt-1">
                                O tipo <span className="font-bold text-white">{topDelayType.name}</span> possui
                                <span className="font-bold text-white"> {topDelayType.delayCount} atrasos</span> ({topDelayType.delayRate}% do total).
                                Ação recomendada: Revisar processos para esse formato.
                            </p>
                        </div>
                    </div>
                )}
                {topSlowType && (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-xl flex items-start gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-full text-blue-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="text-blue-500 font-bold text-lg">Maior Tempo de Produção</h3>
                            <p className="text-zinc-300 text-sm mt-1">
                                <span className="font-bold text-white">{topSlowType.name}</span> leva em média
                                <span className="font-bold text-white"> {topSlowType.avgTime} dias</span> para ser concluído.
                                Considere aumentar o prazo padrão para este tipo de demanda.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* TYPES SECTION */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Tag size={20} className="text-primary" />
                    Performance por Tipo de Demanda
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Volume vs Delays Chart */}
                    <div className="card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <h3 className="text-white font-bold mb-6 text-sm">Volume vs Taxa de Atraso</h3>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.typeStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" orientation="left" stroke="#60a5fa" tick={{ fill: '#60a5fa', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#f87171" tick={{ fill: '#f87171', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="count" name="Volume Total" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar yAxisId="right" dataKey="delayRate" name="% Atraso" fill="#f87171" radius={[4, 4, 0, 0]} barSize={10} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Avg Time Table */}
                    <div className="card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                        <h3 className="text-white font-bold mb-6 text-sm">Tempo Médio de Produção</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50 border-b border-zinc-800">
                                    <tr>
                                        <th className="px-4 py-3">Tipo</th>
                                        <th className="px-4 py-3 text-right">Média (Dias)</th>
                                        <th className="px-4 py-3 text-right">Volume</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {stats.typeStats.map((t, idx) => (
                                        <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-4 py-3 font-medium text-white">{t.name}</td>
                                            <td className="px-4 py-3 text-right text-zinc-300">{t.avgTime}d</td>
                                            <td className="px-4 py-3 text-right text-zinc-500">{t.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* ORIGINS SECTION */}
            <div className="space-y-6 pt-8 border-t border-zinc-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe size={20} className="text-primary" />
                    Análise por Origem
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Origin Cards */}
                    {stats.originStats.map((o, idx) => (
                        <div key={idx} className="card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl relative overflow-hidden group hover:border-zinc-700 transition-all">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold text-white mb-2">{o.name}</h3>
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase font-bold">Volume</p>
                                        <p className="text-2xl font-bold text-white">{o.count}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase font-bold">Share %</p>
                                        <p className="text-2xl font-bold text-blue-400">{o.sharePercentage}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase font-bold">SLA (Prazo)</p>
                                        <p className={`text-2xl font-bold ${o.slaCompliance >= 90 ? 'text-emerald-500' : o.slaCompliance >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                                            {o.slaCompliance}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Background Decoration */}
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Globe size={100} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};
