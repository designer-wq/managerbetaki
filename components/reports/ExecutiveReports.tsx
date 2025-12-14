import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, Target, Activity, Share2 } from 'lucide-react';

interface ExecutiveReportsProps {
    stats: any;
}

const ExecutiveReports: React.FC<ExecutiveReportsProps> = ({ stats }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* 1. Executive Summary Cards (Big Numbers) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card-enterprise p-6 bg-gradient-to-br from-zinc-900 to-zinc-800 border-none shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="text-[#bcd200]" size={20} />
                        <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Eficiência Global (SLA)</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-white">{stats.globalSLA}%</span>
                        <span className="text-green-500 text-sm font-bold mb-1.5 flex items-center">
                            <TrendingUp size={12} className="mr-0.5" />
                            +{stats.efficiencyTrend}%
                        </span>
                    </div>
                </div>

                <div className="card-enterprise p-6 bg-gradient-to-br from-zinc-900 to-zinc-800 border-none shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <Target className="text-blue-500" size={20} />
                        <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Lead Time Global</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-white">{stats.globalLeadTime}</span>
                        <span className="text-zinc-500 text-sm mb-1.5">dias</span>
                    </div>
                </div>

                <div className="card-enterprise p-6 bg-gradient-to-br from-zinc-900 to-zinc-800 border-none shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <Share2 className="text-purple-500" size={20} />
                        <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Total Entregas</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-white">{stats.totalDemands}</span>
                        <span className="text-zinc-500 text-sm mb-1.5">projetos</span>
                    </div>
                </div>
            </div>

            {/* 2. Strategic Insights & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card-enterprise p-8">
                    <h3 className="text-white font-bold text-lg mb-6">Alocação de Esforço por Tipo</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.typeDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                                <XAxis type="number" stroke="#52525b" fontSize={12} />
                                <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={12} width={100} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="value" fill="#bcd200" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card-enterprise p-6 bg-zinc-900/80">
                    <h3 className="text-white font-bold mb-4">Radar Estratégico</h3>

                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                            <h4 className="text-green-400 font-bold text-sm mb-1">Maturidade do Processo</h4>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                O time aumentou a previsibilidade em 15% este trimestre. O retrabalho caiu para níveis aceitáveis.
                            </p>
                        </div>

                        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <h4 className="text-yellow-400 font-bold text-sm mb-1">Ponto de Atenção</h4>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                Campanhas Sazonais estão consumindo 65% da capacidade. Avaliar contratação temporária.
                            </p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-800">
                            <h4 className="text-white font-bold text-sm mb-2">Automated Insights</h4>
                            <ul className="space-y-2">
                                {stats.insights.map((text: string, i: number) => (
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

        </div>
    );
};

export default ExecutiveReports;
