import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Calendar, Clock, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight, Flag } from 'lucide-react';
import { isStatusCompleted } from '../../../lib/reports/metrics';
import WeeklyHeatmap from '../../../components/reports/WeeklyHeatmap';

interface TimeReportTabProps {
    demands: any[];
}

const COLORS = ['#bcd200', '#60a5fa', '#f472b6', '#a78bfa', '#fbbf24', '#34d399', '#f87171', '#9ca3af'];

export const TimeReportTab: React.FC<TimeReportTabProps> = ({ demands }) => {
    const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // --- Daily Data ---
        const daily = {
            createdToday: 0,
            completedToday: 0,
            dueToday: 0,
            overdueToday: 0, // Should be overdue AND still open
            listOverdue: [] as any[],
            listDueToday: [] as any[],
            listCompletedToday: [] as any[]
        };

        // --- Weekly Data ---
        const weekly = {
            opened: 0,
            completed: 0,
            onTimeCount: 0,
            totalForSla: 0,
            designerLoad: {} as Record<string, number>,
            completionsByDay: [0, 0, 0, 0, 0, 0, 0], // Sun-Sat
            types: {} as Record<string, number>,
            prevWeekCompleted: 0 // Mock or calculate if feasible, hard to get exact "last week" without complex date math on full set. We can approximate.
        };

        // --- Monthly Data ---
        const monthly = {
            total: 0,
            slaSum: 0,
            slaCount: 0,
            bottlenecks: {} as Record<string, number>,
            evolution: {} as Record<string, number>,
            types: {} as Record<string, number>,
            origins: {} as Record<string, number>,
            capacityRate: 0 // Mock logic: Active / (Designers * Capacity)? Hard to know capacity.
        };

        // Date Helpers
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        demands.forEach(d => {
            const isComp = isStatusCompleted(d.statuses?.name);
            const created = d.created_at ? new Date(d.created_at) : null;
            const updated = d.updated_at ? new Date(d.updated_at) : null; // Use updated_at for completion date
            const deadline = d.deadline ? new Date(d.deadline) : null;

            // Normalize dates to midnight for comparison
            const deadlineDay = deadline ? new Date(deadline) : null;
            if (deadlineDay) deadlineDay.setHours(0, 0, 0, 0);

            const todayDay = new Date(now);
            todayDay.setHours(0, 0, 0, 0);

            const updatedDay = updated ? new Date(updated) : null;
            if (updatedDay) updatedDay.setHours(0, 0, 0, 0);

            // 1. Daily Logic
            if (created && created.toDateString() === now.toDateString()) daily.createdToday++;

            if (isComp && updated && updated.toDateString() === now.toDateString()) {
                daily.completedToday++;
                daily.listCompletedToday.push(d);
            }

            if (!isComp && deadlineDay) {
                if (deadlineDay.getTime() === todayDay.getTime()) {
                    daily.dueToday++;
                    daily.listDueToday.push(d);
                } else if (deadlineDay < todayDay) {
                    daily.overdueToday++;
                    daily.listOverdue.push(d);
                }
            }

            // 2. Weekly Logic (Current Week)
            if (updated && updated >= startOfWeek) {
                if (isComp) {
                    weekly.completed++;
                    weekly.completionsByDay[updated.getDay()]++;

                    // On Time?
                    if (deadlineDay) {
                        if (updatedDay! <= deadlineDay) weekly.onTimeCount++;
                    } else {
                        weekly.onTimeCount++;
                    }
                    weekly.totalForSla++;
                }
            }
            if (created && created >= startOfWeek) {
                weekly.opened++;
                // Type Vol
                const type = d.demand_types?.name || 'Outros';
                weekly.types[type] = (weekly.types[type] || 0) + 1;
            }

            // Active Load (Approximation for weekly overload)
            if (!isComp) {
                const des = d.responsible?.name || 'N/A';
                if (des !== 'N/A') weekly.designerLoad[des] = (weekly.designerLoad[des] || 0) + 1;
            }

            // 3. Monthly Logic (Current Month)
            if (created && created >= startOfMonth) {
                monthly.total++;
                const type = d.demand_types?.name || 'Outros';
                monthly.types[type] = (monthly.types[type] || 0) + 1;

                const origin = d.origins?.name || 'N/A';
                monthly.origins[origin] = (monthly.origins[origin] || 0) + 1;
            }

            if (isComp && updated && updated >= startOfMonth) {
                // SLA
                if (created) {
                    const diff = Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
                    monthly.slaSum += diff;
                    monthly.slaCount++;
                }
            }

            // Monthly Evolution (Created by month-day or just accumulate created count over last 30 days?)
            // "Evolução mensal" usually means "Jan, Feb, Mar".
            // Let's use `trendMap` logic from GeneralReport or just aggregate by month for the full dataset to show trend line.
            if (created) {
                const k = created.toLocaleString('pt-BR', { month: 'short' });
                monthly.evolution[k] = (monthly.evolution[k] || 0) + 1;
            }
        });

        return { daily, weekly, monthly };
    }, [demands]);

    const weeklyChartData = [
        { name: 'Dom', val: stats.weekly.completionsByDay[0] },
        { name: 'Seg', val: stats.weekly.completionsByDay[1] },
        { name: 'Ter', val: stats.weekly.completionsByDay[2] },
        { name: 'Qua', val: stats.weekly.completionsByDay[3] },
        { name: 'Qui', val: stats.weekly.completionsByDay[4] },
        { name: 'Sex', val: stats.weekly.completionsByDay[5] },
        { name: 'Sab', val: stats.weekly.completionsByDay[6] },
    ];

    const monthlyTypeData = Object.entries(stats.monthly.types).map(([name, value]) => ({ name, value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Navigation Switch */}
            <div className="flex justify-center mb-8">
                <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-lg flex items-center gap-1">
                    <button
                        onClick={() => setView('daily')}
                        className={`text-xs font-bold px-4 py-2 rounded-md transition-all ${view === 'daily' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Diário
                    </button>
                    <button
                        onClick={() => setView('weekly')}
                        className={`text-xs font-bold px-4 py-2 rounded-md transition-all ${view === 'weekly' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Semanal
                    </button>
                    <button
                        onClick={() => setView('monthly')}
                        className={`text-xs font-bold px-4 py-2 rounded-md transition-all ${view === 'monthly' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Mensal
                    </button>
                </div>
            </div>

            {/* DAILY VIEW */}
            {view === 'daily' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <span className="text-zinc-500 text-xs font-bold uppercase">Criadas Hoje</span>
                            <p className="text-2xl font-bold text-white mt-1">{stats.daily.createdToday}</p>
                        </div>
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <span className="text-zinc-500 text-xs font-bold uppercase">Concluídas Hoje</span>
                            <p className="text-2xl font-bold text-emerald-500 mt-1">{stats.daily.completedToday}</p>
                        </div>
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <span className="text-zinc-500 text-xs font-bold uppercase">Vencem Hoje</span>
                            <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.daily.dueToday}</p>
                        </div>
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <span className="text-zinc-500 text-xs font-bold uppercase">Atrasadas Hoje</span>
                            <p className="text-2xl font-bold text-red-500 mt-1">{stats.daily.overdueToday}</p>
                        </div>
                    </div>

                    <div className="card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Flag size={18} className="text-primary" />
                            Lista Inteligente
                        </h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {/* Priority Order: Overdue -> Due Today -> Completed Today */}
                            {stats.daily.listOverdue.map(d => (
                                <div key={d.id} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle size={16} className="text-red-500" />
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium text-sm">{d.title}</span>
                                            <span className="text-zinc-500 text-xs">Venceu: {new Date(d.deadline).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-red-500/10 text-red-500 rounded font-bold">Atrasada</span>
                                </div>
                            ))}

                            {stats.daily.listDueToday.map(d => (
                                <div key={d.id} className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Clock size={16} className="text-yellow-500" />
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium text-sm">{d.title}</span>
                                            <span className="text-zinc-500 text-xs">Responsável: {d.responsible?.name || '-'}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded font-bold">Vence Hoje</span>
                                </div>
                            ))}

                            {stats.daily.listCompletedToday.map(d => (
                                <div key={d.id} className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle size={16} className="text-emerald-500" />
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium text-sm">{d.title}</span>
                                            <span className="text-zinc-500 text-xs">Entregue às {new Date(d.updated_at).toLocaleTimeString().slice(0, 5)}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded font-bold">Concluído</span>
                                </div>
                            ))}

                            {stats.daily.listOverdue.length === 0 && stats.daily.listDueToday.length === 0 && stats.daily.listCompletedToday.length === 0 && (
                                <div className="text-center py-8 text-zinc-500">
                                    Nenhuma atividade relevante registrada hoje.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* WEEKLY VIEW */}
            {view === 'weekly' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <span className="text-zinc-500 text-xs font-bold uppercase">Demandas Abertas</span>
                            <p className="text-2xl font-bold text-white mt-1">{stats.weekly.opened}</p>
                        </div>
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <span className="text-zinc-500 text-xs font-bold uppercase">Concluídas</span>
                            <p className="text-2xl font-bold text-emerald-500 mt-1">{stats.weekly.completed}</p>
                        </div>
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <span className="text-zinc-500 text-xs font-bold uppercase">% no Prazo</span>
                            <p className="text-2xl font-bold text-blue-500 mt-1">{stats.weekly.totalForSla > 0 ? Math.round((stats.weekly.onTimeCount / stats.weekly.totalForSla) * 100) : 0}%</p>
                        </div>
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <span className="text-zinc-500 text-xs font-bold uppercase">Top Sobrecarga</span>
                            <p className="text-sm font-bold text-white mt-2 truncate">
                                {Object.entries(stats.weekly.designerLoad).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <h3 className="text-white font-bold mb-6">Conclusões por Dia da Semana</h3>
                            <div className="w-full h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weeklyChartData}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }} />
                                        <Bar dataKey="val" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <h3 className="text-white font-bold mb-6">Volume por Tipo</h3>
                            <div className="w-full h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={Object.entries(stats.weekly.types).map(([name, value]) => ({ name, value }))}
                                            dataKey="value"
                                            outerRadius={80}
                                            innerRadius={50}
                                        >
                                            {Object.entries(stats.weekly.types).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MONTHLY VIEW */}
            {view === 'monthly' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                            <div>
                                <span className="text-zinc-500 text-xs font-bold uppercase">Total Demandas (Mês)</span>
                                <p className="text-3xl font-bold text-white mt-1">{stats.monthly.total}</p>
                            </div>
                            <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Calendar size={20} />
                            </div>
                        </div>
                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                            <div>
                                <span className="text-zinc-500 text-xs font-bold uppercase">SLA Médio Mensal</span>
                                <p className="text-3xl font-bold text-purple-500 mt-1">{stats.monthly.slaCount > 0 ? (stats.monthly.slaSum / stats.monthly.slaCount).toFixed(1) : 0}d</p>
                            </div>
                            <div className="size-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <Clock size={20} />
                            </div>
                        </div>
                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                            <div>
                                <span className="text-zinc-500 text-xs font-bold uppercase">Maiores Gargalos</span>
                                <p className="text-sm font-bold text-white mt-2">
                                    Em breve (análise de status)
                                </p>
                            </div>
                            <div className="size-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                <AlertTriangle size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <h3 className="text-white font-bold mb-6">Tipos de Demandas (Mês)</h3>
                            <div className="w-full h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={monthlyTypeData}
                                            dataKey="value"
                                            outerRadius={80}
                                        >
                                            {monthlyTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="card-enterprise p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <h3 className="text-white font-bold mb-6">Padrão de Criação (Dia/Hora)</h3>
                            <WeeklyHeatmap demands={demands} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
