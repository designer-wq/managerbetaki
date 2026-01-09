import React, { useMemo } from 'react';
import { Target, CheckCircle, TrendingUp, Zap, Trophy, Clock } from 'lucide-react';

interface DesignerGoalsProps {
    demands: any[];
    userName: string;
    dailyGoal?: number;
    weeklyGoal?: number;
}

const DesignerGoals: React.FC<DesignerGoalsProps> = ({
    demands,
    userName,
    dailyGoal = 5,
    weeklyGoal = 25
}) => {
    // Calculate today's stats
    const todayStats = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Completed today (based on updated_at for completion tracking)
        const completedToday = demands.filter(d => {
            const status = d.statuses?.name?.toLowerCase() || '';
            const isCompleted = status.includes('conclu') || status.includes('agendado') || status.includes('postar');
            if (!isCompleted) return false;

            const updatedAt = d.updated_at ? new Date(d.updated_at) : null;
            if (!updatedAt) return false;

            return updatedAt >= todayStart;
        }).length;

        // Pending for today (deadline = today, not completed)
        const pendingToday = demands.filter(d => {
            if (!d.deadline) return false;

            const status = d.statuses?.name?.toLowerCase() || '';
            const isCompleted = status.includes('conclu') || status.includes('agendado') || status.includes('postar');
            if (isCompleted) return false;

            const deadline = new Date(d.deadline.split('T')[0] + 'T12:00:00');
            return deadline.toDateString() === now.toDateString();
        }).length;

        const remaining = Math.max(0, dailyGoal - completedToday);
        const progress = Math.min(100, Math.round((completedToday / dailyGoal) * 100));
        const goalReached = completedToday >= dailyGoal;

        return {
            completedToday,
            pendingToday,
            remaining,
            progress,
            goalReached
        };
    }, [demands, dailyGoal]);

    // Calculate weekly stats
    const weeklyStats = useMemo(() => {
        const now = new Date();
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const completedThisWeek = demands.filter(d => {
            const status = d.statuses?.name?.toLowerCase() || '';
            const isCompleted = status.includes('conclu') || status.includes('agendado') || status.includes('postar');
            if (!isCompleted) return false;

            const updatedAt = d.updated_at ? new Date(d.updated_at) : null;
            if (!updatedAt) return false;

            return updatedAt >= startOfWeek;
        }).length;

        const remaining = Math.max(0, weeklyGoal - completedThisWeek);
        const progress = Math.min(100, Math.round((completedThisWeek / weeklyGoal) * 100));
        const goalReached = completedThisWeek >= weeklyGoal;
        const daysLeft = 7 - diffToMonday - 1; // Days remaining in the week

        return {
            completedThisWeek,
            remaining,
            progress,
            goalReached,
            daysLeft
        };
    }, [demands, weeklyGoal]);

    // Get first name
    const firstName = userName?.split(' ')[0] || 'Designer';

    // Motivational message based on progress
    const getMessage = () => {
        if (todayStats.goalReached) {
            return { text: '🎉 Meta do dia alcançada! Excelente trabalho!', color: 'text-emerald-400' };
        }
        if (todayStats.remaining <= 2) {
            return { text: `🔥 Quase lá! Faltam apenas ${todayStats.remaining}!`, color: 'text-amber-400' };
        }
        if (todayStats.completedToday > 0) {
            return { text: `💪 Bom ritmo! Continue assim, ${firstName}!`, color: 'text-blue-400' };
        }
        return { text: `👋 Bom dia, ${firstName}! Vamos começar?`, color: 'text-zinc-400' };
    };

    const message = getMessage();

    return (
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-6 mb-6">
            {/* Header with greeting */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <Target size={24} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Minhas Metas</h2>
                        <p className={`text-sm ${message.color}`}>{message.text}</p>
                    </div>
                </div>

                {todayStats.goalReached && (
                    <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full animate-pulse">
                        <Trophy size={20} />
                        <span className="font-bold text-sm">Meta Batida!</span>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Daily Progress */}
                <div className="bg-zinc-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap size={16} className="text-amber-400" />
                        <span className="text-xs text-zinc-400 uppercase font-medium">Hoje</span>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold text-white">{todayStats.completedToday}</span>
                        <span className="text-zinc-500 text-sm mb-1">/ {dailyGoal}</span>
                    </div>
                    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${todayStats.goalReached ? 'bg-emerald-500' : 'bg-primary'}`}
                            style={{ width: `${todayStats.progress}%` }}
                        />
                    </div>
                    {!todayStats.goalReached && (
                        <p className="text-xs text-zinc-500 mt-2">
                            Faltam <span className="text-primary font-bold">{todayStats.remaining}</span> para a meta
                        </p>
                    )}
                </div>

                {/* Weekly Progress */}
                <div className="bg-zinc-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={16} className="text-blue-400" />
                        <span className="text-xs text-zinc-400 uppercase font-medium">Semana</span>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold text-white">{weeklyStats.completedThisWeek}</span>
                        <span className="text-zinc-500 text-sm mb-1">/ {weeklyGoal}</span>
                    </div>
                    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${weeklyStats.goalReached ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${weeklyStats.progress}%` }}
                        />
                    </div>
                    {!weeklyStats.goalReached && (
                        <p className="text-xs text-zinc-500 mt-2">
                            Faltam <span className="text-blue-400 font-bold">{weeklyStats.remaining}</span> ({weeklyStats.daysLeft} dias)
                        </p>
                    )}
                </div>

                {/* Pending Today */}
                <div className="bg-zinc-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock size={16} className="text-purple-400" />
                        <span className="text-xs text-zinc-400 uppercase font-medium">Prazo Hoje</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold ${todayStats.pendingToday > 0 ? 'text-purple-400' : 'text-zinc-600'}`}>
                            {todayStats.pendingToday}
                        </span>
                        <span className="text-zinc-500 text-sm mb-1">demandas</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                        {todayStats.pendingToday > 0 ? 'Precisam de atenção' : 'Tudo em dia! ✓'}
                    </p>
                </div>

                {/* Completed Badge */}
                <div className="bg-zinc-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle size={16} className="text-emerald-400" />
                        <span className="text-xs text-zinc-400 uppercase font-medium">Entregas</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-emerald-400">{todayStats.completedToday}</span>
                        <span className="text-zinc-500 text-sm mb-1">hoje</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                        {todayStats.completedToday > 0
                            ? `+${Math.round(todayStats.completedToday / dailyGoal * 100)}% da meta diária`
                            : 'Nenhuma entrega ainda'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DesignerGoals;
