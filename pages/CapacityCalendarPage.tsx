import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Users,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
    Filter
} from 'lucide-react';
import { fetchDemands, fetchAuthUsersList } from '../lib/api';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { Skeleton } from '../components/ui/Skeleton';

interface DayData {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    demands: any[];
    designerLoads: Record<string, number>;
}

const CapacityCalendarPage = () => {
    const [demands, setDemands] = useState<any[]>([]);
    const [designers, setDesigners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
    const [selectedDesigner, setSelectedDesigner] = useState<string>('all');

    // Capacity settings (can be made configurable)
    const DAILY_CAPACITY = 8; // Max demands per designer per day
    const WARNING_THRESHOLD = 6; // Yellow warning
    const CRITICAL_THRESHOLD = 8; // Red critical

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);

        const [demandsData] = await Promise.all([
            fetchDemands()
        ]);

        setDemands(demandsData || []);

        // Fetch designers
        let onlyDesigners: any[] = [];
        try {
            const authUsers = await fetchAuthUsersList();
            if (authUsers) {
                onlyDesigners = authUsers.filter((u: any) => {
                    if (u.status !== 'active' || !u.job_title_name) return false;
                    const jobTitle = u.job_title_name.toLowerCase();
                    return jobTitle.includes('designer') || jobTitle.includes('video maker') || jobTitle.includes('videomaker');
                });
            }
        } catch (err) {
            console.error("Error fetching designers:", err);
        }
        setDesigners(onlyDesigners);

        if (!silent) setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    useRealtimeSubscription(['demands'], () => loadData(true));

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startingDayOfWeek = firstDayOfMonth.getDay();
        const daysInMonth = lastDayOfMonth.getDate();

        const days: DayData[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Previous month days
        const prevMonth = new Date(year, month, 0);
        const prevMonthDays = prevMonth.getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthDays - i);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: false,
                demands: [],
                designerLoads: {}
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            date.setHours(12, 0, 0, 0);

            // Get demands for this day (by deadline)
            const dayDemands = demands.filter(d => {
                if (!d.deadline) return false;
                const deadline = new Date(d.deadline.split('T')[0] + 'T12:00:00');
                return deadline.toDateString() === date.toDateString();
            });

            // Filter by selected designer if applicable
            const filteredDemands = selectedDesigner === 'all'
                ? dayDemands
                : dayDemands.filter(d => d.responsible_id === selectedDesigner);

            // Calculate load per designer
            const designerLoads: Record<string, number> = {};
            dayDemands.forEach(d => {
                if (d.responsible_id) {
                    designerLoads[d.responsible_id] = (designerLoads[d.responsible_id] || 0) + 1;
                }
            });

            days.push({
                date,
                isCurrentMonth: true,
                isToday: date.toDateString() === today.toDateString(),
                demands: filteredDemands,
                designerLoads
            });
        }

        // Next month days (fill to complete the grid)
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(year, month + 1, i);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: false,
                demands: [],
                designerLoads: {}
            });
        }

        return days;
    }, [currentDate, demands, selectedDesigner]);

    // Calculate overall stats
    const stats = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekDemands = demands.filter(d => {
            if (!d.deadline) return false;
            const deadline = new Date(d.deadline.split('T')[0] + 'T12:00:00');
            return deadline >= weekStart && deadline <= weekEnd;
        });

        const overloaded = calendarDays.filter(day => {
            if (!day.isCurrentMonth) return false;
            return Object.values(day.designerLoads).some((load: number) => load >= CRITICAL_THRESHOLD);
        }).length;

        const avgDailyLoad = calendarDays
            .filter(d => d.isCurrentMonth && d.demands.length > 0)
            .reduce((sum, d) => sum + d.demands.length, 0) /
            Math.max(1, calendarDays.filter(d => d.isCurrentMonth && d.demands.length > 0).length);

        return {
            weekTotal: weekDemands.length,
            monthTotal: demands.filter(d => {
                if (!d.deadline) return false;
                const deadline = new Date(d.deadline.split('T')[0] + 'T12:00:00');
                return deadline.getMonth() === currentDate.getMonth() &&
                    deadline.getFullYear() === currentDate.getFullYear();
            }).length,
            overloadedDays: overloaded,
            avgDailyLoad: Math.round(avgDailyLoad * 10) / 10
        };
    }, [demands, calendarDays, currentDate]);

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
            return newDate;
        });
    };

    const getLoadColor = (load: number, total: number) => {
        if (total === 0) return 'bg-zinc-800';
        const maxLoad = Math.max(...Object.values(load) as number[], 1);
        if (maxLoad >= CRITICAL_THRESHOLD) return 'bg-red-500/30 border-red-500/50';
        if (maxLoad >= WARNING_THRESHOLD) return 'bg-amber-500/30 border-amber-500/50';
        if (total > 0) return 'bg-emerald-500/20 border-emerald-500/30';
        return 'bg-zinc-800';
    };

    const getDayLoadLevel = (day: DayData): 'empty' | 'light' | 'medium' | 'heavy' | 'critical' => {
        if (day.demands.length === 0) return 'empty';
        const maxLoad = Math.max(...Object.values(day.designerLoads), 0);
        if (maxLoad >= CRITICAL_THRESHOLD) return 'critical';
        if (maxLoad >= WARNING_THRESHOLD) return 'heavy';
        if (day.demands.length >= 5) return 'medium';
        return 'light';
    };

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    if (loading) {
        return (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
                <Header title="Calendário de Capacidade" subtitle="Loading..." />
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <Skeleton className="h-[600px] w-full" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
            <Header
                title="Calendário de Capacidade"
                subtitle="Visualize a carga de trabalho da equipe"
            />

            <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 custom-scrollbar">
                <div className="max-w-7xl mx-auto">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar size={18} className="text-blue-400" />
                                <span className="text-xs text-zinc-500 uppercase">Esta Semana</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{stats.weekTotal}</p>
                            <p className="text-xs text-zinc-500">demandas</p>
                        </div>

                        <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={18} className="text-primary" />
                                <span className="text-xs text-zinc-500 uppercase">Este Mês</span>
                            </div>
                            <p className="text-2xl font-bold text-primary">{stats.monthTotal}</p>
                            <p className="text-xs text-zinc-500">demandas</p>
                        </div>

                        <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={18} className="text-red-400" />
                                <span className="text-xs text-zinc-500 uppercase">Sobrecarga</span>
                            </div>
                            <p className="text-2xl font-bold text-red-400">{stats.overloadedDays}</p>
                            <p className="text-xs text-zinc-500">dias críticos</p>
                        </div>

                        <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={18} className="text-amber-400" />
                                <span className="text-xs text-zinc-500 uppercase">Média/Dia</span>
                            </div>
                            <p className="text-2xl font-bold text-amber-400">{stats.avgDailyLoad}</p>
                            <p className="text-xs text-zinc-500">demandas</p>
                        </div>
                    </div>

                    {/* Calendar Header */}
                    <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-zinc-700/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigateMonth('prev')}
                                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                                >
                                    <ChevronLeft size={20} className="text-white" />
                                </button>
                                <h2 className="text-xl font-bold text-white">
                                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </h2>
                                <button
                                    onClick={() => navigateMonth('next')}
                                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                                >
                                    <ChevronRight size={20} className="text-white" />
                                </button>
                            </div>

                            {/* Designer Filter */}
                            <div className="flex items-center gap-3">
                                <Filter size={16} className="text-zinc-500" />
                                <select
                                    value={selectedDesigner}
                                    onChange={(e) => setSelectedDesigner(e.target.value)}
                                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                                >
                                    <option value="all">Todos os Designers</option>
                                    {designers.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="px-4 py-2 border-b border-zinc-800/50 flex items-center gap-4 text-xs">
                            <span className="text-zinc-500">Legenda:</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-zinc-800" />
                                <span className="text-zinc-400">Vazio</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-emerald-500/30" />
                                <span className="text-zinc-400">Normal</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-amber-500/30" />
                                <span className="text-zinc-400">Alto ({WARNING_THRESHOLD}+)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-red-500/30" />
                                <span className="text-zinc-400">Crítico ({CRITICAL_THRESHOLD}+)</span>
                            </div>
                        </div>

                        {/* Week Days Header */}
                        <div className="grid grid-cols-7 border-b border-zinc-800">
                            {weekDays.map((day, idx) => (
                                <div
                                    key={day}
                                    className={`py-3 text-center text-xs font-medium uppercase ${idx === 0 || idx === 6 ? 'text-zinc-600' : 'text-zinc-400'
                                        }`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7">
                            {calendarDays.map((day, idx) => {
                                const loadLevel = getDayLoadLevel(day);
                                const loadColors = {
                                    empty: 'bg-zinc-900/30',
                                    light: 'bg-emerald-500/10 border-emerald-500/20',
                                    medium: 'bg-emerald-500/20 border-emerald-500/30',
                                    heavy: 'bg-amber-500/20 border-amber-500/30',
                                    critical: 'bg-red-500/20 border-red-500/30'
                                };

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => day.isCurrentMonth && setSelectedDay(day)}
                                        className={`
                                            min-h-[100px] p-2 border border-zinc-800/50 transition-all cursor-pointer
                                            ${day.isCurrentMonth ? loadColors[loadLevel] : 'bg-zinc-950/50'}
                                            ${day.isToday ? 'ring-2 ring-primary ring-inset' : ''}
                                            ${day.isCurrentMonth ? 'hover:border-zinc-600' : ''}
                                        `}
                                    >
                                        <div className={`text-sm font-medium mb-1 ${day.isCurrentMonth
                                            ? day.isToday ? 'text-primary' : 'text-white'
                                            : 'text-zinc-600'
                                            }`}>
                                            {day.date.getDate()}
                                        </div>

                                        {day.isCurrentMonth && day.demands.length > 0 && (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1">
                                                    <span className={`text-xs font-bold ${loadLevel === 'critical' ? 'text-red-400' :
                                                        loadLevel === 'heavy' ? 'text-amber-400' :
                                                            'text-emerald-400'
                                                        }`}>
                                                        {day.demands.length}
                                                    </span>
                                                    <span className="text-xs text-zinc-500">
                                                        {day.demands.length === 1 ? 'demanda' : 'demandas'}
                                                    </span>
                                                </div>

                                                {/* Designer badges */}
                                                <div className="flex flex-wrap gap-0.5">
                                                    {Object.entries(day.designerLoads).slice(0, 3).map(([id, count]) => {
                                                        const designer = designers.find(d => d.id === id);
                                                        const isOverloaded = (count as number) >= WARNING_THRESHOLD;
                                                        return (
                                                            <div
                                                                key={id}
                                                                className={`text-[9px] px-1 py-0.5 rounded ${isOverloaded
                                                                    ? 'bg-red-500/30 text-red-400'
                                                                    : 'bg-zinc-700/50 text-zinc-400'
                                                                    }`}
                                                                title={`${designer?.name || 'N/A'}: ${count} demandas`}
                                                            >
                                                                {designer?.name?.split(' ')[0]?.slice(0, 3) || '?'}:{count}
                                                            </div>
                                                        );
                                                    })}
                                                    {Object.keys(day.designerLoads).length > 3 && (
                                                        <span className="text-[9px] text-zinc-500">
                                                            +{Object.keys(day.designerLoads).length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Day Detail Modal */}
                    {selectedDay && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                            onClick={() => setSelectedDay(null)}
                        >
                            <div
                                className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">
                                            {selectedDay.date.toLocaleDateString('pt-BR', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long'
                                            })}
                                        </h3>
                                        <p className="text-sm text-zinc-400">
                                            {selectedDay.demands.length} demandas programadas
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDay(null)}
                                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                                    {selectedDay.demands.length === 0 ? (
                                        <div className="py-8 text-center text-zinc-500">
                                            <Calendar className="mx-auto mb-3 text-zinc-600" size={32} />
                                            <p>Nenhuma demanda para este dia</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {/* Designer Summary */}
                                            <div className="bg-zinc-800/50 rounded-lg p-3 mb-4">
                                                <p className="text-xs text-zinc-500 uppercase mb-2">Carga por Designer</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(selectedDay.designerLoads).map(([id, count]) => {
                                                        const designer = designers.find(d => d.id === id);
                                                        const isOverloaded = (count as number) >= WARNING_THRESHOLD;
                                                        return (
                                                            <div
                                                                key={id}
                                                                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${isOverloaded
                                                                    ? 'bg-red-500/20 border border-red-500/30'
                                                                    : 'bg-zinc-700/50'
                                                                    }`}
                                                            >
                                                                <span className={`text-sm font-medium ${isOverloaded ? 'text-red-400' : 'text-white'
                                                                    }`}>
                                                                    {designer?.name?.split(' ')[0] || 'N/A'}
                                                                </span>
                                                                <span className={`text-lg font-bold ${isOverloaded ? 'text-red-400' : 'text-primary'
                                                                    }`}>
                                                                    {count}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Demands List */}
                                            {selectedDay.demands.map(d => (
                                                <div
                                                    key={d.id}
                                                    className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-white font-medium truncate">
                                                                {d.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span
                                                                    className="text-xs px-2 py-0.5 rounded font-medium"
                                                                    style={{
                                                                        backgroundColor: d.statuses?.color + '30' || '#52525b30',
                                                                        color: d.statuses?.color || '#a1a1aa'
                                                                    }}
                                                                >
                                                                    {d.statuses?.name || 'Sem status'}
                                                                </span>
                                                                <span className="text-xs text-zinc-500">
                                                                    {d.demand_types?.name || 'Geral'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {d.responsible?.avatar_url ? (
                                                                <img
                                                                    src={d.responsible.avatar_url}
                                                                    alt=""
                                                                    className="w-8 h-8 rounded-full"
                                                                />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-white font-bold">
                                                                    {d.responsible?.name?.slice(0, 2).toUpperCase() || '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default CapacityCalendarPage;
