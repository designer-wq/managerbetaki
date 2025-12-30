import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Calendar, Crown, Clock, AlertTriangle, Check, TrendingUp } from 'lucide-react';
import { isStatusCompleted } from '../../../lib/reports/metrics';

interface DesignerReportTabProps {
    demands: any[];
}

interface DesignerStats {
    id: string;
    name: string;
    avatar_url?: string;

    // KPIs
    totalAssigned: number;
    totalCompleted: number;
    totalDelayed: number;
    onTimeCount: number;

    // Time Stats (in ms)
    totalLeadTime: number; // For average calculation

    // Breakdowns
    typeCounts: Record<string, number>; // For pie chart
    typeBreakdown: Record<string, Record<string, number>>; // For tooltip detail
    dailyCounts: Record<string, number>; // For activity chart

    // Computed (later)
    avgLeadTimeDays: number;
    onTimePercentage: number;
}

const COLORS = ['#bcd200', '#60a5fa', '#f472b6', '#a78bfa', '#fbbf24', '#34d399', '#f87171', '#9ca3af'];

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const breakdown = data.breakdown || {};
        const sortedStatuses = Object.entries(breakdown).sort((a: any, b: any) => b[1] - a[1]);

        return (
            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-xl outline-none">
                <p className="text-white font-bold mb-2 text-sm">{data.name}</p>
                <div className="space-y-1">
                    <div className="flex justify-between gap-4 text-xs">
                        <span className="text-zinc-400">Total</span>
                        <span className="text-white font-bold">{data.value}</span>
                    </div>
                    <div className="h-px bg-zinc-800 my-1" />
                    {sortedStatuses.map(([status, count]: any) => (
                        <div key={status} className="flex justify-between gap-4 text-xs">
                            <span className="text-zinc-500 capitalize">{status.toLowerCase()}</span>
                            <span className="text-zinc-300">{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export const DesignerReportTab: React.FC<DesignerReportTabProps> = ({ demands }) => {

    const stats = useMemo(() => {
        const designerMap: Record<string, DesignerStats> = {};
        const globalDaily: Record<string, number> = {};

        const now = new Date();

        demands.forEach(d => {
            // Robust check for responsible
            const designerId = d.responsible?.id || 'unassigned';
            const designerName = d.responsible?.name || 'Não Atribuído';
            const avatarUrl = d.responsible?.avatar_url;

            if (!designerMap[designerName]) {
                designerMap[designerName] = {
                    id: designerId,
                    name: designerName,
                    avatar_url: avatarUrl,
                    totalAssigned: 0,
                    totalCompleted: 0,
                    totalDelayed: 0,
                    onTimeCount: 0,
                    totalLeadTime: 0,
                    typeCounts: {},
                    typeBreakdown: {},
                    dailyCounts: {},
                    avgLeadTimeDays: 0,
                    onTimePercentage: 0
                };
            }

            const stats = designerMap[designerName];
            stats.totalAssigned++;

            const statusName = d.statuses?.name || 'Sem status';
            const isComp = isStatusCompleted(statusName);
            const typeName = d.demand_types?.name || 'Outros';

            // Type Breakdown
            stats.typeCounts[typeName] = (stats.typeCounts[typeName] || 0) + 1;

            // Status Breakdown per Type
            if (!stats.typeBreakdown[typeName]) stats.typeBreakdown[typeName] = {};
            stats.typeBreakdown[typeName][statusName] = (stats.typeBreakdown[typeName][statusName] || 0) + 1;


            if (isComp) {
                stats.totalCompleted++;

                // Delivery Date
                const dateStr = d.updated_at; // Strict Use
                if (dateStr) {
                    const dateObj = new Date(dateStr);
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const dayKey = `${year}-${month}-${day}`;

                    stats.dailyCounts[dayKey] = (stats.dailyCounts[dayKey] || 0) + 1;
                    globalDaily[dayKey] = (globalDaily[dayKey] || 0) + 1;

                    // Lead Time
                    const startRaw = d.created_at;
                    if (startRaw) {
                        const start = new Date(startRaw).getTime();
                        const end = dateObj.getTime();
                        stats.totalLeadTime += (end - start);
                    }

                    // On Time Check (Strict Date vs Date)
                    if (d.deadline) {
                        const deadline = new Date(d.deadline);
                        // Normalize to start of day for strict date comparison as requested
                        // "a % do prazo deve ser contada com prazo - dia da entraga" -> ignoring time
                        const deliveryDate = new Date(dateObj);
                        deliveryDate.setHours(0, 0, 0, 0);
                        deadline.setHours(0, 0, 0, 0);

                        if (deliveryDate <= deadline) stats.onTimeCount++;
                    } else {
                        stats.onTimeCount++; // No deadline = On Time
                    }
                }
            } else {
                // Not completed, check delay
                if (d.deadline) {
                    const deadline = new Date(d.deadline);
                    deadline.setHours(23, 59, 59, 999);
                    if (now > deadline) stats.totalDelayed++;
                }
            }
        });

        // Computed Stats & Array Conversion
        const designers = Object.values(designerMap).map(d => {
            const avgLeadTimeMs = d.totalCompleted > 0 ? d.totalLeadTime / d.totalCompleted : 0;
            const avgLeadTimeDays = parseFloat((avgLeadTimeMs / (1000 * 60 * 60 * 24)).toFixed(1));
            const onTimePercentage = d.totalCompleted > 0 ? Math.round((d.onTimeCount / d.totalCompleted) * 100) : 0;

            return {
                ...d,
                avgLeadTimeDays,
                onTimePercentage
            };
        });

        // Filter out 'Unassigned' if they have 0 completed (optional, or keep to show potential backlog)
        // Let's keep them to ensure visibility, but maybe sort them last.
        designers.sort((a, b) => {
            if (a.id === 'unassigned') return 1;
            if (b.id === 'unassigned') return -1;
            return b.totalCompleted - a.totalCompleted;
        });

        // Chart Data (Last 7 Days)
        // If no data globally, generate last 7 days empty
        let daysToShow: string[] = [];
        if (Object.keys(globalDaily).length === 0) {
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                daysToShow.push(`${y}-${m}-${day}`);
            }
        } else {
            const sortedDays = Object.keys(globalDaily).sort();
            daysToShow = sortedDays.slice(-7);
        }

        const chartData = daysToShow.map(day => {
            const dateObj = new Date(day + 'T12:00:00');
            const dayNum = dateObj.getDate();
            const month = dateObj.toLocaleString('pt-BR', { month: 'short' });
            const formatted = `${dayNum}.${month}`;

            const entry: any = { name: formatted };
            designers.forEach(des => {
                entry[des.name] = des.dailyCounts[day] || 0;
            });
            return entry;
        });

        return { designers, chartData };
    }, [demands]);

    if (!demands || demands.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-zinc-900 p-4 rounded-full mb-4">
                    <AlertTriangle className="text-zinc-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sem dados para exibir</h3>
                <p className="text-zinc-500 w-full max-w-md">Não foram encontradas demandas para gerar o relatório de performance.</p>
            </div>
        );
    }

    // Helpers for Ranking/Badges
    const getProductivityRank = (idx: number) => idx + 1;
    const getMostEfficient = () => [...stats.designers].sort((a, b) => b.onTimePercentage - a.onTimePercentage)[0];
    const getSlowest = () => [...stats.designers].sort((a, b) => b.avgLeadTimeDays - a.avgLeadTimeDays)[0]; // Max SLA

    const efficientOne = getMostEfficient();
    const slowestOne = getSlowest();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Headers */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-bold text-white">Performance Individual</h2>
                    <p className="text-zinc-400">Análise detalhada de produtividade e eficiência por designer.</p>
                </div>
            </div>

            {/* Ranking Highlights */}
            {stats.designers.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Top Performer */}
                    <div className="card-enterprise p-4 bg-zinc-900 border border-zinc-800 rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-24 bg-yellow-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-yellow-500/10 transition-colors"></div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="size-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                                <Crown size={24} />
                            </div>
                            <div>
                                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Top Produtividade</span>
                                <h3 className="text-lg font-bold text-white">{stats.designers[0].name}</h3>
                                <p className="text-sm text-yellow-500 font-medium">{stats.designers[0].totalCompleted} Entregas</p>
                            </div>
                        </div>
                    </div>

                    {/* Efficiency Star */}
                    {efficientOne && (
                        <div className="card-enterprise p-4 bg-zinc-900 border border-zinc-800 rounded-xl relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-24 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-colors"></div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Mais Eficiente</span>
                                    <h3 className="text-lg font-bold text-white">{efficientOne.name}</h3>
                                    <p className="text-sm text-emerald-500 font-medium">{efficientOne.onTimePercentage}% no Prazo</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SLA Alert */}
                    {slowestOne && (
                        <div className="card-enterprise p-4 bg-zinc-900 border border-zinc-800 rounded-xl relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-24 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-red-500/10 transition-colors"></div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="size-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Maior SLA Médio</span>
                                    <h3 className="text-lg font-bold text-white">{slowestOne.name}</h3>
                                    <p className="text-sm text-red-500 font-medium">{slowestOne.avgLeadTimeDays} dias / demanda</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Individual Cards */}
            <div className="grid grid-cols-1 gap-6">
                {stats.designers.map((designer, idx) => (
                    <div key={designer.id} className="card-enterprise bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all">
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-800 bg-zinc-950/30 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative">
                                    <div className="size-16 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-700 shadow-lg">
                                        {designer.avatar_url ? (
                                            <img src={designer.avatar_url} alt={designer.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-bold text-zinc-500">{designer.name.substring(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-zinc-800 text-white text-xs font-bold size-8 flex items-center justify-center rounded-lg border border-zinc-700 shadow-sm">
                                        #{idx + 1}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{designer.name}</h3>
                                    <span className="text-zinc-500 text-sm">Designer Pleno</span>
                                </div>
                            </div>

                            {/* Main Metrics Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
                                <div className="px-4 py-2 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
                                    <p className="text-2xl font-bold text-white">{designer.totalCompleted}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Concluídas</p>
                                </div>
                                <div className="px-4 py-2 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
                                    <p className="text-2xl font-bold text-white">{designer.totalAssigned}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Atribuídas</p>
                                </div>
                                <div className="px-4 py-2 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
                                    <p className={`text-2xl font-bold ${designer.totalDelayed > 0 ? 'text-red-500' : 'text-zinc-500'}`}>{designer.totalDelayed}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Atrasos</p>
                                </div>
                                <div className="px-4 py-2 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
                                    <p className={`text-2xl font-bold ${designer.onTimePercentage >= 90 ? 'text-emerald-500' : designer.onTimePercentage >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>{designer.onTimePercentage}%</p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">No Prazo</p>
                                </div>
                            </div>
                        </div>

                        {/* Body (Charts & Breakdown) */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                            {/* Comparison Stats */}
                            <div className="space-y-6">
                                <h4 className="text-white font-medium text-sm border-b border-zinc-800 pb-2">Métricas de Tempo</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-blue-500" />
                                            <span className="text-zinc-400 text-sm">Lead Time Médio</span>
                                        </div>
                                        <span className="text-white font-bold">{designer.avgLeadTimeDays} dias</span>
                                    </div>
                                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                        {/* Visual bar just for decoration or relative to strict max? */}
                                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(designer.avgLeadTimeDays * 10, 100)}%` }}></div>
                                    </div>
                                    <p className="text-xs text-zinc-500">
                                        *Tempo desde a criação até a conclusão da demanda.
                                    </p>
                                </div>
                            </div>

                            {/* Type Distribution */}
                            <div>
                                <h4 className="text-white font-medium text-sm border-b border-zinc-800 pb-2 mb-4">Tipos de Peças</h4>
                                <div className="flex items-center gap-4">
                                    <div className="size-32 shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={Object.entries(designer.typeCounts).map(([name, value]) => ({ name, value, breakdown: designer.typeBreakdown[name] }))}
                                                    innerRadius={25}
                                                    outerRadius={40}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {Object.entries(designer.typeCounts).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomPieTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        {Object.entries(designer.typeCounts)
                                            .sort((a: any, b: any) => b[1] - a[1]) // Sort by count
                                            .slice(0, 4) // Show top 4
                                            .map(([name, count], i) => (
                                                <div key={name} className="flex justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                                        <span className="text-zinc-400 truncate max-w-[100px]">{name}</span>
                                                    </div>
                                                    <span className="text-white font-bold">{count}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>

                            {/* Activity Chart Mini */}
                            <div>
                                <h4 className="text-white font-medium text-sm border-b border-zinc-800 pb-2 mb-4">Atividade (7 Dias)</h4>
                                <div className="h-40 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={
                                                stats.chartData.map((d: any) => ({
                                                    name: d.name,
                                                    value: d[designer.name] || 0
                                                }))
                                            }
                                            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#71717a', fontSize: 10 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#71717a', fontSize: 10 }}
                                            />
                                            <Bar dataKey="value" fill="#3f3f46" radius={[4, 4, 0, 0]} activeBar={{ fill: '#bcd200' }} />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px', fontSize: '10px', color: '#fff' }}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Team Comparison Chart */}
            <div className="card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl mt-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    Comparativo de Produção Diária (Time Completo)
                </h3>
                <div className="w-full h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#71717a"
                                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#71717a"
                                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                                cursor={{ fill: '#27272a', opacity: 0.4 }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            {stats.designers.map((d, index) => (
                                <Bar
                                    key={d.name}
                                    dataKey={d.name}
                                    fill={COLORS[index % COLORS.length]}
                                    radius={[4, 4, 0, 0]}
                                    barSize={24}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
