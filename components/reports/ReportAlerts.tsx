import React, { useMemo } from 'react';
import { AlertTriangle, TrendingDown, Clock, Users, Zap, CheckCircle } from 'lucide-react';

interface Alert {
    id: string;
    type: 'critical' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    metric?: string;
    icon: React.ReactNode;
}

interface ReportAlertsProps {
    demands: any[];
    className?: string;
}

export const ReportAlerts: React.FC<ReportAlertsProps> = ({ demands, className = '' }) => {
    const alerts = useMemo(() => {
        const alertsList: Alert[] = [];
        const now = new Date();

        // Calculate metrics
        let totalActive = 0;
        let totalDelayed = 0;
        let totalCompleted = 0;
        const designerLoad: Record<string, number> = {};
        const completedLast7Days: any[] = [];

        demands.forEach(d => {
            const s = d.statuses?.name?.toLowerCase() || '';
            const isCompleted = s.includes('conclu') || s.includes('entregue') || s.includes('finalizado') ||
                s.includes('postar') || s.includes('agendado');
            const isActive = s.includes('produ') || s.includes('andamento') || s.includes('revis') || s.includes('backlog');

            if (isCompleted) {
                totalCompleted++;
                if (d.updated_at) {
                    const completedDate = new Date(d.updated_at);
                    const daysDiff = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysDiff <= 7) completedLast7Days.push(d);
                }
            }

            if (isActive) {
                totalActive++;
                const designer = d.responsible?.name;
                if (designer) {
                    designerLoad[designer] = (designerLoad[designer] || 0) + 1;
                }
            }

            // Check delayed
            if (!isCompleted && d.deadline) {
                const deadline = new Date(d.deadline);
                deadline.setHours(23, 59, 59, 999);
                if (now > deadline) totalDelayed++;
            }
        });

        // Calculate delay rate
        const delayRate = totalActive > 0 ? Math.round((totalDelayed / totalActive) * 100) : 0;

        // Alert 1: High delay rate (> 20%)
        if (delayRate > 20) {
            alertsList.push({
                id: 'high-delay-rate',
                type: 'critical',
                title: 'Taxa de Atraso Alta',
                message: `${delayRate}% das demandas ativas estão atrasadas. Revise os prazos e priorize a conclusão.`,
                metric: `${delayRate}%`,
                icon: <TrendingDown size={18} />
            });
        }

        // Alert 2: Overloaded designers (> 15 active tasks)
        const OVERLOAD_THRESHOLD = 15;
        const overloadedDesigners = Object.entries(designerLoad)
            .filter(([_, count]) => count > OVERLOAD_THRESHOLD)
            .sort((a, b) => (b[1] as number) - (a[1] as number));

        if (overloadedDesigners.length > 0) {
            alertsList.push({
                id: 'designer-overload',
                type: 'warning',
                title: 'Sobrecarga de Designer',
                message: `${overloadedDesigners[0][0]} está com ${overloadedDesigners[0][1]} demandas ativas. Considere redistribuir.`,
                metric: `${overloadedDesigners[0][1]} tarefas`,
                icon: <Users size={18} />
            });
        }

        // Alert 3: Many demands due today
        const dueToday = demands.filter(d => {
            const s = d.statuses?.name?.toLowerCase() || '';
            const isCompleted = s.includes('conclu') || s.includes('entregue');
            if (isCompleted) return false;

            if (!d.deadline) return false;
            const deadline = new Date(d.deadline);
            return deadline.toDateString() === now.toDateString();
        });

        if (dueToday.length >= 5) {
            alertsList.push({
                id: 'many-due-today',
                type: 'warning',
                title: 'Alto Volume para Hoje',
                message: `${dueToday.length} demandas vencem hoje. Priorize a conclusão para evitar atrasos.`,
                metric: `${dueToday.length} demandas`,
                icon: <Clock size={18} />
            });
        }

        // Alert 4: Good performance (completed many this week)
        if (completedLast7Days.length >= 20) {
            alertsList.push({
                id: 'good-performance',
                type: 'success',
                title: 'Ótima Performance!',
                message: `${completedLast7Days.length} demandas concluídas nos últimos 7 dias. O time está performando bem!`,
                metric: `${completedLast7Days.length} concluídas`,
                icon: <CheckCircle size={18} />
            });
        }

        // Alert 5: Stalled demands (in revision for too long) - would need created_at or status change tracking
        // For now, skip this one as it requires more complex tracking

        return alertsList;
    }, [demands]);

    if (alerts.length === 0) {
        return null;
    }

    const getAlertStyles = (type: Alert['type']) => {
        switch (type) {
            case 'critical':
                return 'bg-red-500/10 border-red-500/20 text-red-500';
            case 'warning':
                return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
            case 'success':
                return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
            default:
                return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border ${getAlertStyles(alert.type)}`}
                >
                    <div className={`p-2 rounded-full ${alert.type === 'critical' ? 'bg-red-500/20' : alert.type === 'warning' ? 'bg-yellow-500/20' : alert.type === 'success' ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
                        {alert.icon}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm">{alert.title}</h4>
                            {alert.metric && (
                                <span className="text-xs font-bold opacity-80">{alert.metric}</span>
                            )}
                        </div>
                        <p className="text-sm opacity-80 mt-1">{alert.message}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReportAlerts;
