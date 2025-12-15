import React from 'react';
import { BarChart as BarChartIcon, AlertTriangle, User, Loader2 } from 'lucide-react';

interface ManagerReportsProps {
    stats: any;
}

const ManagerReports: React.FC<ManagerReportsProps> = ({ stats }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* 1. Operational Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card-enterprise p-5 bg-zinc-900 border-l-4 border-l-blue-500">
                    <h3 className="text-zinc-400 text-xs font-bold uppercase mb-2">Demandas Ativas</h3>
                    <p className="text-3xl font-bold text-white">{stats.totalActive}</p>
                </div>
                <div className="card-enterprise p-5 bg-zinc-900 border-l-4 border-l-orange-500">
                    <h3 className="text-zinc-400 text-xs font-bold uppercase mb-2">Em Risco (Prazo + Prioridade)</h3>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="text-orange-500" size={24} />
                        <p className="text-3xl font-bold text-white">{stats.atRiskCount}</p>
                    </div>
                    {stats.atRiskCount > 0 && (
                        <p className="text-xs text-orange-400 mt-1">Requer atenção imediata</p>
                    )}
                </div>
                <div className="card-enterprise p-5 bg-zinc-900 border-l-4 border-l-purple-500">
                    <h3 className="text-zinc-400 text-xs font-bold uppercase mb-2">Gargalo Atual</h3>
                    <div className="flex items-center gap-2">
                        {stats.byStatus.length > 0 ? (
                            (() => {
                                const bottleneck = [...stats.byStatus].sort((a: any, b: any) => b.value - a.value)[0];
                                return (
                                    <>
                                        <Loader2 className="text-purple-500 animate-spin-slow" size={24} />
                                        <p className="text-lg font-bold text-white">
                                            {bottleneck.name} ({Math.round((bottleneck.value / stats.totalActive) * 100)}%)
                                        </p>
                                    </>
                                );
                            })()
                        ) : (
                            <p className="text-zinc-500 font-medium">Sem gargalos detectados</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2. Team Workload */}
                <div className="lg:col-span-2 card-enterprise p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <User size={20} className="text-[#bcd200]" />
                            Carga da Equipe
                        </h3>
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Capacidade Estimada: 10 tarefas/un</span>
                    </div>

                    <div className="space-y-4">
                        {stats.teamWorkload.map((user: any, index: number) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full text-zinc-500 font-bold text-xs">{user.name.slice(0, 2)}</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-white font-medium text-sm">{user.name}</span>
                                        <span className="text-zinc-400 text-xs">{user.tasks} tarefas ({Math.round(user.capacityPct)}%)</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${user.capacityPct > 100 ? 'bg-red-500' :
                                                user.capacityPct > 80 ? 'bg-orange-500' :
                                                    'bg-[#bcd200]'
                                                }`}
                                            style={{ width: `${Math.min(user.capacityPct, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Status Distribution */}
                <div className="card-enterprise p-6">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                        <BarChartIcon size={20} className="text-zinc-500" />
                        Status
                    </h3>
                    <div className="space-y-3">
                        {stats.byStatus.map((status: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors border border-zinc-700/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                                    <span className="text-zinc-300 text-sm font-medium">{status.name}</span>
                                </div>
                                <span className="text-white font-bold">{status.value}</span>
                            </div>
                        ))}
                        {stats.byStatus.length === 0 && (
                            <p className="text-zinc-500 text-center py-4">Sem dados</p>
                        )}
                    </div>
                </div>
            </div>

        </div >
    );
};

export default ManagerReports;
