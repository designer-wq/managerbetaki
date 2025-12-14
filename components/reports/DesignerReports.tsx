import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Clock, CheckCircle, AlertTriangle, Layers, TrendingUp } from 'lucide-react';

interface DesignerReportsProps {
    stats: any;
}

const COLORS = ['#bcd200', '#ffffff', '#52525b', '#a1a1aa'];

const DesignerReports: React.FC<DesignerReportsProps> = ({ stats }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1. Insights Banner */}
            <div className="card-enterprise card-neutral p-4 flex flex-col md:flex-row items-center gap-4 bg-zinc-900/50 border-l-4 border-l-[#bcd200]">
                <div className="p-2 bg-[#bcd200]/10 rounded-lg">
                    <TrendingUp className="text-[#bcd200]" size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-white font-bold text-sm">Insights de Performance</h3>
                    <div className="flex flex-col gap-1 mt-1">
                        {stats.insights.map((insight: string, idx: number) => (
                            <p key={idx} className="text-zinc-400 text-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#bcd200]"></span>
                                {insight}
                            </p>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card-enterprise p-5 flex flex-col gap-2">
                    <span className="text-zinc-400 text-xs font-medium uppercase">Demandas Concluídas</span>
                    <div className="flex items-center gap-3">
                        <CheckCircle size={28} className="text-[#bcd200]" />
                        <span className="text-3xl font-bold text-white">{stats.completedCount}</span>
                    </div>
                </div>

                <div className="card-enterprise p-5 flex flex-col gap-2">
                    <span className="text-zinc-400 text-xs font-medium uppercase">SLA Pessoal</span>
                    <div className="flex items-center gap-3">
                        <Clock size={28} className={stats.slaCompliance >= 90 ? "text-green-500" : "text-yellow-500"} />
                        <span className="text-3xl font-bold text-white">{stats.slaCompliance}%</span>
                    </div>
                </div>

                <div className="card-enterprise p-5 flex flex-col gap-2">
                    <span className="text-zinc-400 text-xs font-medium uppercase">Lead Time Médio</span>
                    <div className="flex items-center gap-3">
                        <Layers size={28} className="text-zinc-500" />
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-white">{stats.avgLeadTime}</span>
                            <span className="text-sm text-zinc-500">dias</span>
                        </div>
                    </div>
                </div>

                <div className="card-enterprise p-5 flex flex-col gap-2">
                    <span className="text-zinc-400 text-xs font-medium uppercase">Média de Revisões</span>
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={28} className="text-orange-500" />
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-white">{stats.revisionsAvg}</span>
                            <span className="text-sm text-zinc-500">/demanda</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribution */}
                <div className="card-enterprise p-6 flex flex-col">
                    <h3 className="text-white font-bold mb-4">Distribuição do seu Trabalho</h3>
                    <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.distribution}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.distribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center mt-4">
                        {stats.distribution.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-sm text-zinc-400">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline */}
                <div className="card-enterprise p-6 flex flex-col">
                    <h3 className="text-white font-bold mb-4">Ritmo de Produção (Semanal)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.productionTimeline}>
                                <defs>
                                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#bcd200" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#bcd200" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} cursor={{ fill: 'transparent' }} />
                                <Area type="monotone" dataKey="value" stroke="#bcd200" strokeWidth={3} fillOpacity={1} fill="url(#colorProd)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignerReports;
