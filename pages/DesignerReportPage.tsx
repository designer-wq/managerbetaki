import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import {
    Users,
    CheckCircle,
    Clock,
    AlertTriangle,
    Calendar,
    ChevronDown,
    TrendingUp,
    TrendingDown,
    Minus,
    Award,
    Target,
    BarChart3,
    Filter
} from 'lucide-react';
import { fetchDemands, fetchProfiles, fetchAuthUsersList } from '../lib/api';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';

interface DesignerStats {
    id: string;
    name: string;
    avatar_url?: string;
    completed: number;
    completedOnTime: number;
    completedLate: number;
    pending: number;
    overdue: number;
    inProduction: number;
    totalDeadlineThisPeriod: number;
    avgTimeMinutes: number;
    efficiency: number;
}

const DesignerReportPage = () => {
    const { user } = useAuth();
    const [allDemands, setAllDemands] = useState<any[]>([]);
    const [designers, setDesigners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDesigner, setSelectedDesigner] = useState<string>('all');

    // User role detection
    const role = user?.role?.toLowerCase() || '';
    const jobTitle = user?.job_title?.toLowerCase() || '';
    const isAdmin = ['admin', 'administrador', 'master'].includes(role);
    const isSocialMedia = jobTitle.includes('social') || role.includes('social');
    const isDesigner = jobTitle.includes('designer') || role.includes('designer');
    const isVideoMaker = jobTitle.includes('video') || role.includes('video') || jobTitle.includes('vídeo');
    const canViewAllDemands = isAdmin || isSocialMedia;

    // Filtered demands based on user role
    const demands = useMemo(() => {
        if (canViewAllDemands) return allDemands;

        // Designer/VideoMaker sees only their demands
        if (isDesigner || isVideoMaker) {
            const userId = user?.id;
            const userName = user?.name?.toLowerCase().trim() || '';
            const userEmail = user?.email?.toLowerCase().trim() || '';

            return allDemands.filter(d => {
                const responsibleId = d.responsible_id;
                const responsibleProfileId = d.responsible?.id;
                const responsibleName = (d.responsible?.name || '').toLowerCase().trim();
                const responsibleEmail = (d.responsible?.email || '').toLowerCase().trim();

                const matchById = responsibleId === userId || responsibleProfileId === userId;
                const matchByName = responsibleName && userName && (
                    responsibleName === userName ||
                    responsibleName.includes(userName) ||
                    userName.includes(responsibleName)
                );
                const matchByEmail = responsibleEmail && userEmail && responsibleEmail === userEmail;

                return matchById || matchByName || matchByEmail;
            });
        }

        return allDemands;
    }, [allDemands, canViewAllDemands, isDesigner, isVideoMaker, user]);

    // Date filter state
    const [dateFilter, setDateFilter] = useState<{
        type: 'all' | 'this_week' | 'this_month' | 'last_month' | 'custom';
        startDate: string | null;
        endDate: string | null;
    }>({ type: 'this_month', startDate: null, endDate: null });
    const [showDateMenu, setShowDateMenu] = useState(false);
    const [customDateStart, setCustomDateStart] = useState('');
    const [customDateEnd, setCustomDateEnd] = useState('');

    // Calculate date ranges
    const getDateRange = useMemo(() => {
        const now = new Date();

        if (dateFilter.type === 'all') {
            return { start: null, end: null };
        }

        if (dateFilter.type === 'this_week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(now);
            monday.setDate(diff);
            monday.setHours(0, 0, 0, 0);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);
            return { start: monday, end: sunday };
        }

        if (dateFilter.type === 'this_month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            return { start, end };
        }

        if (dateFilter.type === 'last_month') {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            return { start, end };
        }

        if (dateFilter.type === 'custom' && dateFilter.startDate && dateFilter.endDate) {
            const start = new Date(dateFilter.startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(dateFilter.endDate);
            end.setHours(23, 59, 59, 999);
            return { start, end };
        }

        return { start: null, end: null };
    }, [dateFilter]);

    const handleDateFilterChange = (type: 'all' | 'this_week' | 'this_month' | 'last_month' | 'custom') => {
        if (type === 'custom') {
            setDateFilter({ ...dateFilter, type: 'custom' });
        } else {
            setDateFilter({ type, startDate: null, endDate: null });
            setShowDateMenu(false);
        }
    };

    const applyCustomDateFilter = () => {
        if (customDateStart && customDateEnd) {
            setDateFilter({
                type: 'custom',
                startDate: customDateStart,
                endDate: customDateEnd
            });
            setShowDateMenu(false);
        }
    };

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);

        const [demandsData] = await Promise.all([
            fetchDemands()
        ]);

        setAllDemands(demandsData || []);

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
            const profilesData = await fetchProfiles();
            onlyDesigners = (profilesData || []).filter((p: any) => {
                const jobTitle = (p.job_title || p.job_title_name || '').toLowerCase();
                return jobTitle.includes('designer') ||
                    jobTitle.includes('video maker') ||
                    jobTitle.includes('videomaker') ||
                    p.role === 'DESIGNER';
            });
        }
        setDesigners(onlyDesigners);

        if (!silent) setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    useRealtimeSubscription(['demands'], () => loadData(true));

    // Helper functions
    const isCompletedStatus = (statusName: string) => {
        const s = statusName.toLowerCase();
        return s.includes('conclu') ||
            s.includes('entregue') ||
            s.includes('finalizado') ||
            s.includes('postar') ||
            s.includes('agendado');
    };

    const isInProductionStatus = (statusName: string) => {
        const s = statusName.toLowerCase();
        return s.includes('produção') || s.includes('producao');
    };

    const isPendingStatus = (statusName: string) => {
        const s = statusName.toLowerCase();
        return !isCompletedStatus(s) && (
            s.includes('backlog') ||
            s.includes('revisão') ||
            s.includes('revisao') ||
            s.includes('ag. odds') ||
            s.includes('ag.odds') ||
            s.includes('pendente')
        );
    };

    const isOverdue = (demand: any) => {
        const statusName = demand.statuses?.name || '';
        if (isCompletedStatus(statusName) || !demand.deadline) return false;

        const deadlineDate = new Date(demand.deadline.split('T')[0] + 'T23:59:59');
        return new Date() > deadlineDate;
    };

    const wasCompletedOnTime = (demand: any) => {
        if (!demand.deadline) return true;

        const deadlineDate = new Date(demand.deadline.split('T')[0] + 'T23:59:59');
        const finishedDate = demand.finished_at ? new Date(demand.finished_at) : null;

        if (finishedDate) {
            return finishedDate <= deadlineDate;
        }
        return true; // Assume on time if no finished_at
    };

    // Filter demands by deadline date range
    const filteredDemandsByDate = useMemo(() => {
        if (!getDateRange.start || !getDateRange.end) {
            return demands;
        }

        return demands.filter(d => {
            if (!d.deadline) return false;

            const deadlineDate = new Date(d.deadline.split('T')[0] + 'T12:00:00');
            return deadlineDate >= getDateRange.start! && deadlineDate <= getDateRange.end!;
        });
    }, [demands, getDateRange]);

    // Calculate stats per designer
    const designerStats: DesignerStats[] = useMemo(() => {
        const stats: Record<string, DesignerStats> = {};

        designers.forEach(designer => {
            stats[designer.id] = {
                id: designer.id,
                name: designer.name,
                avatar_url: designer.avatar_url,
                completed: 0,
                completedOnTime: 0,
                completedLate: 0,
                pending: 0,
                overdue: 0,
                inProduction: 0,
                totalDeadlineThisPeriod: 0,
                avgTimeMinutes: 0,
                efficiency: 0
            };
        });

        // Track time for average calculation
        const timeTracker: Record<string, { total: number; count: number }> = {};

        filteredDemandsByDate.forEach(demand => {
            const designerId = demand.responsible_id;
            if (!designerId || !stats[designerId]) return;

            const statusName = demand.statuses?.name || '';

            stats[designerId].totalDeadlineThisPeriod++;

            if (isCompletedStatus(statusName)) {
                stats[designerId].completed++;

                if (wasCompletedOnTime(demand)) {
                    stats[designerId].completedOnTime++;
                } else {
                    stats[designerId].completedLate++;
                }

                // Track time
                if (demand.accumulated_time) {
                    if (!timeTracker[designerId]) {
                        timeTracker[designerId] = { total: 0, count: 0 };
                    }
                    timeTracker[designerId].total += demand.accumulated_time / 60; // Convert to minutes
                    timeTracker[designerId].count++;
                }
            } else if (isInProductionStatus(statusName)) {
                stats[designerId].inProduction++;
                if (isOverdue(demand)) {
                    stats[designerId].overdue++;
                }
            } else {
                stats[designerId].pending++;
                if (isOverdue(demand)) {
                    stats[designerId].overdue++;
                }
            }
        });

        // Calculate averages and efficiency
        Object.keys(stats).forEach(id => {
            if (timeTracker[id] && timeTracker[id].count > 0) {
                stats[id].avgTimeMinutes = Math.round(timeTracker[id].total / timeTracker[id].count);
            }

            const total = stats[id].completedOnTime + stats[id].completedLate;
            if (total > 0) {
                stats[id].efficiency = Math.round((stats[id].completedOnTime / total) * 100);
            } else {
                stats[id].efficiency = 0;
            }
        });

        return Object.values(stats).sort((a, b) => b.totalDeadlineThisPeriod - a.totalDeadlineThisPeriod);
    }, [designers, filteredDemandsByDate]);

    // Overall stats
    const overallStats = useMemo(() => {
        return designerStats.reduce((acc, d) => ({
            total: acc.total + d.totalDeadlineThisPeriod,
            completed: acc.completed + d.completed,
            completedOnTime: acc.completedOnTime + d.completedOnTime,
            completedLate: acc.completedLate + d.completedLate,
            pending: acc.pending + d.pending,
            inProduction: acc.inProduction + d.inProduction,
            overdue: acc.overdue + d.overdue
        }), {
            total: 0,
            completed: 0,
            completedOnTime: 0,
            completedLate: 0,
            pending: 0,
            inProduction: 0,
            overdue: 0
        });
    }, [designerStats]);

    // Filter designer stats
    const filteredDesignerStats = useMemo(() => {
        if (selectedDesigner === 'all') {
            return designerStats;
        }
        return designerStats.filter(d => d.id === selectedDesigner);
    }, [designerStats, selectedDesigner]);

    const getEfficiencyColor = (efficiency: number) => {
        if (efficiency >= 80) return 'text-emerald-400';
        if (efficiency >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    const getEfficiencyBg = (efficiency: number) => {
        if (efficiency >= 80) return 'bg-emerald-500/20';
        if (efficiency >= 60) return 'bg-amber-500/20';
        return 'bg-red-500/20';
    };

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    };

    const getDateFilterLabel = () => {
        switch (dateFilter.type) {
            case 'all': return 'Todas as Datas';
            case 'this_week': return 'Esta Semana';
            case 'this_month': return 'Este Mês';
            case 'last_month': return 'Mês Passado';
            case 'custom': return 'Personalizado';
            default: return 'Selecionar Período';
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
                <Header title="Relatório de Designers" subtitle="Análise de performance por prazo" />
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <Skeleton className="h-32 w-full" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Skeleton className="h-40" />
                            <Skeleton className="h-40" />
                            <Skeleton className="h-40" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
            <Header
                title="Relatório de Designers"
                subtitle="Análise de performance por prazo"
            />

            <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 custom-scrollbar">
                <div className="max-w-7xl mx-auto">

                    {/* User-specific view indicator */}
                    {!canViewAllDemands && (isDesigner || isVideoMaker) && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
                            <Users size={20} className="text-blue-400" />
                            <div>
                                <span className="text-blue-400 font-medium">Meu Relatório</span>
                                <span className="text-zinc-400 text-sm ml-2">
                                    Exibindo estatísticas baseadas nas suas {demands.length} demandas
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Page Header */}
                    <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl flex items-center gap-3">
                                <BarChart3 className="text-primary" size={36} />
                                Performance dos Designers
                            </h1>
                            <p className="text-zinc-400 mt-2">
                                Acompanhe entregas, prazos e eficiência da equipe de design
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-3">
                            {/* Designer Filter */}
                            <div className="relative min-w-[200px]">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <select
                                    value={selectedDesigner}
                                    onChange={(e) => setSelectedDesigner(e.target.value)}
                                    className="w-full appearance-none bg-zinc-900/70 border border-zinc-700/50 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                                >
                                    <option value="all">Todos os Designers</option>
                                    {designers.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                            </div>

                            {/* Date Filter */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowDateMenu(!showDateMenu)}
                                    className="flex items-center gap-2 bg-zinc-900/70 border border-zinc-700/50 rounded-xl py-2.5 px-4 text-sm text-white hover:border-primary/50 transition-all"
                                >
                                    <Calendar size={18} className="text-zinc-500" />
                                    <span>{getDateFilterLabel()}</span>
                                    <ChevronDown size={14} className={`text-zinc-500 transition-transform ${showDateMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showDateMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowDateMenu(false)} />
                                        <div className="absolute top-full right-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-2 z-20">
                                            {[
                                                { type: 'all' as const, label: 'Todas as Datas' },
                                                { type: 'this_week' as const, label: 'Esta Semana' },
                                                { type: 'this_month' as const, label: 'Este Mês' },
                                                { type: 'last_month' as const, label: 'Mês Passado' },
                                            ].map(option => (
                                                <button
                                                    key={option.type}
                                                    onClick={() => handleDateFilterChange(option.type)}
                                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${dateFilter.type === option.type
                                                        ? 'bg-primary/20 text-primary'
                                                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}

                                            <div className="border-t border-zinc-700 mt-2 pt-2">
                                                <p className="px-4 py-1 text-xs text-zinc-500 font-medium">Período Personalizado</p>
                                                <div className="px-4 py-2 space-y-2">
                                                    <input
                                                        type="date"
                                                        value={customDateStart}
                                                        onChange={(e) => setCustomDateStart(e.target.value)}
                                                        className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                                                    />
                                                    <input
                                                        type="date"
                                                        value={customDateEnd}
                                                        onChange={(e) => setCustomDateEnd(e.target.value)}
                                                        className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                                                    />
                                                    <button
                                                        onClick={applyCustomDateFilter}
                                                        disabled={!customDateStart || !customDateEnd}
                                                        className="w-full bg-primary text-black font-medium py-2 rounded-lg text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Aplicar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Overall Stats Cards - Horizontal Grid at Top */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4 hover:border-zinc-600 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-8 w-8 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                                    <Target size={16} className="text-zinc-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">{overallStats.total}</p>
                            <p className="text-xs text-zinc-500 mt-1">Total no Período</p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-950/50 to-zinc-900 border border-emerald-500/20 rounded-2xl p-4 hover:border-emerald-500/40 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle size={16} className="text-emerald-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-emerald-400">{overallStats.completed}</p>
                            <p className="text-xs text-zinc-500 mt-1">Concluídas</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-950/50 to-zinc-900 border border-green-500/20 rounded-2xl p-4 hover:border-green-500/40 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <TrendingUp size={16} className="text-green-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-green-400">{overallStats.completedOnTime}</p>
                            <p className="text-xs text-zinc-500 mt-1">No Prazo</p>
                        </div>

                        <div className="bg-gradient-to-br from-amber-950/50 to-zinc-900 border border-amber-500/20 rounded-2xl p-4 hover:border-amber-500/40 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                    <TrendingDown size={16} className="text-amber-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-amber-400">{overallStats.completedLate}</p>
                            <p className="text-xs text-zinc-500 mt-1">Atrasadas</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-950/50 to-zinc-900 border border-blue-500/20 rounded-2xl p-4 hover:border-blue-500/40 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Clock size={16} className="text-blue-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-blue-400">{overallStats.inProduction}</p>
                            <p className="text-xs text-zinc-500 mt-1">Em Produção</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-950/50 to-zinc-900 border border-purple-500/20 rounded-2xl p-4 hover:border-purple-500/40 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                    <Minus size={16} className="text-purple-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-purple-400">{overallStats.pending}</p>
                            <p className="text-xs text-zinc-500 mt-1">Pendentes</p>
                        </div>

                        <div className="bg-gradient-to-br from-red-950/50 to-zinc-900 border border-red-500/20 rounded-2xl p-4 hover:border-red-500/40 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                    <AlertTriangle size={16} className="text-red-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-red-400">{overallStats.overdue}</p>
                            <p className="text-xs text-zinc-500 mt-1">Vencidas</p>
                        </div>
                    </div>

                    {/* Designer Cards Section - Below Stats */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                            <Award className="text-primary" size={20} />
                            Desempenho por Designer
                        </h2>

                        {filteredDesignerStats.length === 0 ? (
                            <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-2xl p-12 text-center">
                                <Users className="mx-auto text-zinc-600 mb-4" size={48} />
                                <p className="text-zinc-400">Nenhum designer encontrado para este período</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredDesignerStats.map((designer) => (
                                    <div
                                        key={designer.id}
                                        className="bg-gradient-to-br from-zinc-900 to-zinc-800/30 border border-zinc-700/50 rounded-2xl p-6 hover:border-primary/30 transition-all group"
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                {designer.avatar_url ? (
                                                    <img
                                                        src={designer.avatar_url}
                                                        alt={designer.name}
                                                        className="h-12 w-12 rounded-full object-cover border-2 border-zinc-700 group-hover:border-primary/50 transition-colors"
                                                    />
                                                ) : (
                                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-zinc-700 flex items-center justify-center text-primary font-bold text-lg">
                                                        {designer.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-semibold text-white text-lg">{designer.name}</h3>
                                                    <p className="text-xs text-zinc-500">
                                                        {designer.totalDeadlineThisPeriod} demandas no período
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Efficiency Badge */}
                                            <div className={`px-3 py-1.5 rounded-full ${getEfficiencyBg(designer.efficiency)} ${getEfficiencyColor(designer.efficiency)} text-sm font-bold`}>
                                                {designer.efficiency}% eficiência
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-3 mb-4">
                                            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                                                <p className="text-2xl font-bold text-emerald-400">{designer.completed}</p>
                                                <p className="text-xs text-zinc-500 mt-1">Concluídas</p>
                                            </div>
                                            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                                                <p className="text-2xl font-bold text-blue-400">{designer.inProduction + designer.pending}</p>
                                                <p className="text-xs text-zinc-500 mt-1">A Fazer</p>
                                            </div>
                                            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                                                <p className="text-2xl font-bold text-red-400">{designer.overdue}</p>
                                                <p className="text-xs text-zinc-500 mt-1">Atrasadas</p>
                                            </div>
                                        </div>

                                        {/* Progress Bar - Completed vs Pending */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-zinc-500 mb-2">
                                                <span>Progresso</span>
                                                <span>{designer.completed}/{designer.totalDeadlineThisPeriod}</span>
                                            </div>
                                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                                                    style={{
                                                        width: designer.totalDeadlineThisPeriod > 0
                                                            ? `${(designer.completed / designer.totalDeadlineThisPeriod) * 100}%`
                                                            : '0%'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Detail Stats */}
                                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-700/50">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-green-400" />
                                                <span className="text-xs text-zinc-400">No prazo: <span className="text-green-400 font-medium">{designer.completedOnTime}</span></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-amber-400" />
                                                <span className="text-xs text-zinc-400">Atrasada na entrega: <span className="text-amber-400 font-medium">{designer.completedLate}</span></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-blue-400" />
                                                <span className="text-xs text-zinc-400">Em produção: <span className="text-blue-400 font-medium">{designer.inProduction}</span></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-purple-400" />
                                                <span className="text-xs text-zinc-400">Pendente: <span className="text-purple-400 font-medium">{designer.pending}</span></span>
                                            </div>
                                        </div>

                                        {/* Avg Time */}
                                        {designer.avgTimeMinutes > 0 && (
                                            <div className="mt-4 pt-4 border-t border-zinc-700/50">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-zinc-500">Tempo médio por demanda</span>
                                                    <span className="text-sm font-medium text-primary">{formatTime(designer.avgTimeMinutes)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>


                </div>
            </div>
        </div>
    );
};

export default DesignerReportPage;
