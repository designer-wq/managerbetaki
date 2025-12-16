import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { TrendingUp, Target, Activity, Share2, Layers } from 'lucide-react';

interface ExecutiveReportsProps {
    stats: any;
    insightsOverride?: string[];
    kpis?: { sla: number; lead: number; deliveries: number; backlog?: number; wip?: number };
    kpisPrevious?: { sla: number; lead: number; deliveries: number; backlog?: number; wip?: number };
    leadTimeByType?: Array<{ name: string; avg_days: number; deliveries: number }>;
    leadTimeByDesigner?: Array<{ name: string; avg_days: number; deliveries: number; total_minutes?: number }>;
    leadTimeByTypePrevious?: Array<{ name: string; avg_days: number; deliveries: number }>;
    leadTimeByDesignerPrevious?: Array<{ name: string; avg_days: number; deliveries: number; total_minutes?: number }>;
    trend?: number;
    monthNames?: { current: string; previous: string };
    monthlyComparison?: {
        created: { current: number; previous: number };
        completed: { current: number; previous: number };
        sla: { current: number; previous: number };
        leadTime: { current: number; previous: number };
    };
}

const ExecutiveReports: React.FC<ExecutiveReportsProps> = ({ 
    stats, 
    insightsOverride, 
    kpis, 
    kpisPrevious,
    leadTimeByType = [], 
    leadTimeByDesigner = [], 
    leadTimeByTypePrevious = [],
    leadTimeByDesignerPrevious = [],
    trend,
    monthNames,
    monthlyComparison
}) => {
    
    const [activeTab, setActiveTab] = React.useState<'current' | 'previous' | 'comparison'>('current');

    const calculateVariation = (current: number, previous: number) => {
        if (!previous) return 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    // Determine data to show based on active tab
    const currentKPIs = activeTab === 'previous' ? kpisPrevious : kpis;
    const currentLeadByType = activeTab === 'previous' ? leadTimeByTypePrevious : leadTimeByType;
    const currentLeadByDesigner = activeTab === 'previous' ? leadTimeByDesignerPrevious : leadTimeByDesigner;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Tab Selector */}
            {monthNames && (
                <div className="flex items-center gap-2 mb-4 bg-zinc-900/50 p-1 rounded-lg w-fit border border-zinc-800">
                    <button 
                        onClick={() => setActiveTab('current')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'current' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        {monthNames.current} (Atual)
                    </button>
                    <button 
                        onClick={() => setActiveTab('previous')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'previous' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        {monthNames.previous} (Anterior)
                    </button>
                    <button 
                        onClick={() => setActiveTab('comparison')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'comparison' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Comparativo
                    </button>
                </div>
            )}

            {/* 1. Executive Summary Cards (Unified Style) */}
            {activeTab !== 'comparison' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="card-enterprise p-6 bg-gradient-to-br from-zinc-900 to-zinc-800 border-none shadow-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <Activity className="text-[#bcd200]" size={20} />
                                <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Eficiência Global (SLA)</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-white">{(currentKPIs?.sla ?? stats.globalSLA)}%</span>
                                {activeTab === 'current' && typeof trend === 'number' && (
                                    <span className="text-green-500 text-sm font-bold mb-1.5 flex items-center">
                                        <TrendingUp size={12} className="mr-0.5" />
                                        {trend > 0 ? `+${trend}%` : `${trend}%`}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="card-enterprise p-6 bg-gradient-to-br from-zinc-900 to-zinc-800 border-none shadow-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <Target className="text-blue-500" size={20} />
                                <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Lead Time Global</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-white">{currentKPIs?.lead ? Math.round(currentKPIs.lead) : Math.round(stats.globalLeadTime * 1440)}</span>
                                <span className="text-zinc-500 text-sm mb-1.5">min</span>
                            </div>
                        </div>

                        <div className="card-enterprise p-6 bg-gradient-to-br from-zinc-900 to-zinc-800 border-none shadow-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <Share2 className="text-purple-500" size={20} />
                                <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Total Entregas</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-white">{currentKPIs?.deliveries ?? stats.totalDemands}</span>
                                <span className="text-zinc-500 text-sm mb-1.5">projetos</span>
                            </div>
                        </div>

                        <div className="card-enterprise p-6 bg-gradient-to-br from-zinc-900 to-zinc-800 border-none shadow-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <Layers className="text-yellow-500" size={20} />
                                <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Backlog</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-white">{currentKPIs?.backlog ?? 0}</span>
                            </div>
                        </div>

                        <div className="card-enterprise p-6 bg-gradient-to-br from-zinc-900 to-zinc-800 border-none shadow-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <Activity className="text-orange-500" size={20} />
                                <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">WIP Atual</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-white">{currentKPIs?.wip ?? 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Lead Time por Tipo e por Designer */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 card-enterprise p-8">
                            <h3 className="text-white font-bold text-lg mb-6">Lead Time por Tipo ({activeTab === 'current' ? monthNames?.current : monthNames?.previous})</h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={(currentLeadByType || []).map(t => ({ name: t.name, value: t.avg_days ? Math.round(t.avg_days) : 0 }))} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                                        <XAxis type="number" stroke="#52525b" fontSize={12} label={{ value: 'min', position: 'insideBottomRight', offset: -7, fill: '#52525b', fontSize: 12 }} />
                                        <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={12} width={120} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            formatter={(value) => [`${value} min`, 'Média por demanda']}
                                        />
                                        <Bar dataKey="value" fill="#bcd200" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="card-enterprise p-6 bg-zinc-900/80">
                            <h3 className="text-white font-bold mb-4">Lead Time por Designer</h3>
                            <div className="space-y-3">
                                {(currentLeadByDesigner || []).map((d, idx) => (
                                    <div key={idx} className="p-3 rounded-lg border border-zinc-800">
                                        <div className="flex items-center justify-between">
                                            <span className="text-zinc-300 text-sm">{d.name}</span>
                                            <span className="text-white text-sm font-bold">{Math.round(d.total_minutes ?? 0)} min</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-zinc-500 text-xs">Média por demanda</span>
                                            <span className="text-zinc-200 text-xs">{Math.round(d.avg_days ?? 0)} min</span>
                                        </div>
                                    </div>
                                ))}
                                {(!currentLeadByDesigner || currentLeadByDesigner.length === 0) && (
                                    <div className="text-zinc-500 text-sm italic">Nenhum dado disponível.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Comparativo Mensal */}
            {(activeTab === 'comparison') && monthlyComparison && monthNames && (
                <div className="card-enterprise p-6 bg-zinc-900/80 border border-zinc-800/50">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Activity size={18} className="text-primary" />
                            Comparativo Mensal
                        </h3>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">{monthNames.previous}</span>
                            <span className="text-zinc-600">vs</span>
                            <span className="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">{monthNames.current}</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-zinc-500 uppercase bg-zinc-800/50">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Indicador</th>
                                    <th className="px-4 py-3 text-right">{monthNames.previous}</th>
                                    <th className="px-4 py-3 text-right">{monthNames.current}</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg">Variação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                <tr className="group hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-4 py-4 font-medium text-zinc-300">Demandas Criadas</td>
                                    <td className="px-4 py-4 text-right text-zinc-400">{monthlyComparison.created.previous}</td>
                                    <td className="px-4 py-4 text-right text-white font-bold">{monthlyComparison.created.current}</td>
                                    <td className="px-4 py-4 text-right">
                                        {(() => {
                                            const v = calculateVariation(monthlyComparison.created.current, monthlyComparison.created.previous);
                                            return (
                                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded ${v > 0 ? 'bg-green-500/10 text-green-400' : v < 0 ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                                    {v > 0 ? '+' : ''}{v}%
                                                </span>
                                            );
                                        })()}
                                    </td>
                                </tr>
                                <tr className="group hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-4 py-4 font-medium text-zinc-300">Entregas Realizadas</td>
                                    <td className="px-4 py-4 text-right text-zinc-400">{monthlyComparison.completed.previous}</td>
                                    <td className="px-4 py-4 text-right text-white font-bold">{monthlyComparison.completed.current}</td>
                                    <td className="px-4 py-4 text-right">
                                        {(() => {
                                            const v = calculateVariation(monthlyComparison.completed.current, monthlyComparison.completed.previous);
                                            return (
                                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded ${v > 0 ? 'bg-green-500/10 text-green-400' : v < 0 ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                                    {v > 0 ? '+' : ''}{v}%
                                                </span>
                                            );
                                        })()}
                                    </td>
                                </tr>
                                <tr className="group hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-4 py-4 font-medium text-zinc-300">SLA Global</td>
                                    <td className="px-4 py-4 text-right text-zinc-400">{monthlyComparison.sla.previous}%</td>
                                    <td className="px-4 py-4 text-right text-white font-bold">{monthlyComparison.sla.current}%</td>
                                    <td className="px-4 py-4 text-right">
                                        {(() => {
                                            const v = monthlyComparison.sla.current - monthlyComparison.sla.previous; // Absolute diff for percentage
                                            return (
                                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded ${v > 0 ? 'bg-green-500/10 text-green-400' : v < 0 ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                                    {v > 0 ? '+' : ''}{v.toFixed(1)}%
                                                </span>
                                            );
                                        })()}
                                    </td>
                                </tr>
                                <tr className="group hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-4 py-4 font-medium text-zinc-300">Lead Time Médio</td>
                                    <td className="px-4 py-4 text-right text-zinc-400">{monthlyComparison.leadTime.previous} min</td>
                                    <td className="px-4 py-4 text-right text-white font-bold">{monthlyComparison.leadTime.current} min</td>
                                    <td className="px-4 py-4 text-right">
                                        {(() => {
                                            const v = calculateVariation(monthlyComparison.leadTime.current, monthlyComparison.leadTime.previous);
                                            // Lower lead time is better (Green if negative)
                                            const isGood = v < 0;
                                            return (
                                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded ${isGood ? 'bg-green-500/10 text-green-400' : v > 0 ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                                    {v > 0 ? '+' : ''}{v}%
                                                </span>
                                            );
                                        })()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 3. Strategic Insights */}
            <div className="card-enterprise p-6 bg-zinc-900/80">
                <h3 className="text-white font-bold mb-4">Radar Estratégico</h3>
                <div className="space-y-4">
                    {((insightsOverride && insightsOverride.length > 0 ? insightsOverride : stats.insights) || []).slice(0, 2).map((text: string, idx: number) => (
                        <div
                            key={idx}
                            className={`p-4 rounded-lg border ${idx === 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}
                        >
                            <h4 className={`font-bold text-sm mb-1 ${idx === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                                {idx === 0 ? 'Ponto Forte' : 'Ponto de Atenção'}
                            </h4>
                            <p className="text-zinc-300 text-xs leading-relaxed">{text}</p>
                        </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                        <h4 className="text-white font-bold text-sm mb-2">Insights</h4>
                        <ul className="space-y-2">
                            {((insightsOverride && insightsOverride.length > 0 ? insightsOverride : stats.insights) || []).map((text: string, i: number) => (
                                <li key={i} className="text-zinc-400 text-xs pl-3 relative">
                                    <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ExecutiveReports;
