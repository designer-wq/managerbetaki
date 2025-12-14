import { useMemo } from 'react';
import { LogEntry } from '../lib/api';

interface Demand {
    id: string;
    title: string;
    status_id: number;
    statuses?: { name: string; color: string };
    priority_id: number;
    priorities?: { name: string; color: string; icon: string };
    type_id: number;
    demand_types?: { name: string };
    responsible_id?: string;
    profiles?: { name: string; avatar_url: string };
    deadline?: string;
    created_at: string;
}

interface AnalyticsStats {
    designer: {
        completedCount: number;
        slaCompliance: number;
        avgLeadTime: number; // in days
        activeCount: number;
        distribution: { name: string; value: number }[];
        productionTimeline: { name: string; value: number }[];
        revisionsAvg: number;
        insights: string[];
    };
    manager: {
        totalActive: number;
        byStatus: { name: string; value: number; color: string }[];
        teamWorkload: { name: string; tasks: number; capacityPct: number; avatar: string }[];
        atRiskCount: number;
        avgTimeByStatus: { status: string; days: number }[];
        insights: string[];
    };
    executive: {
        totalDemands: number;
        globalLeadTime: number;
        globalSLA: number;
        efficiencyTrend: number; // % change
        typeDistribution: { name: string; value: number }[];
        insights: string[];
    };
}

export const useAnalytics = (demands: Demand[], logs: any[], currentUser: any) => {
    const stats = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        // Filter data for period (last 30 days usually, but demands needs all active)
        const recentDemands = demands.filter(d => new Date(d.created_at) >= thirtyDaysAgo);

        // --- Helper Calculations ---

        // Create a map of Status ID -> Name from the demands list (which has joined status data)
        const statusMapId: Record<number, string> = {};
        demands.forEach(d => {
            if (d.status_id && d.statuses?.name) {
                statusMapId[d.status_id] = d.statuses.name.toLowerCase();
            }
        });

        // 1. Lead Time Calculation
        const calculateLeadTime = (demandId: string, createdAt: string): number | null => {
            const completionLog = logs.find(l => {
                if (l.record_id !== demandId || l.action !== 'UPDATE') return false;

                // Parse details to find status change
                // details usually: { status_id: 5, ... } or { statuses: { name: ... } }
                try {
                    const details = typeof l.details === 'string' ? JSON.parse(l.details) : l.details;

                    // Check logic 1: explicitly has 'concluído' text
                    if (JSON.stringify(details).toLowerCase().includes('concluído')) return true;

                    // Check logic 2: has status_id which maps to 'concluído'
                    if (details?.status_id) {
                        const name = statusMapId[details.status_id];
                        if (name && name.includes('concluído')) return true;
                    }
                    return false;
                } catch (e) {
                    return false;
                }
            });

            const demand = demands.find(d => d.id === demandId);
            // Fallback: If current status is Concluído, but no log found, use current time
            if (demand?.statuses?.name.toLowerCase() === 'concluído') {
                const end = completionLog ? new Date(completionLog.created_at) : new Date();
                const start = new Date(createdAt);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            return null;
        };

        const leadTimes = demands
            .map(d => calculateLeadTime(d.id, d.created_at))
            .filter((t): t is number => t !== null);

        const avgLeadTimeGlobal = leadTimes.length > 0
            ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
            : 0;

        // 2. SLA Compliance
        const slaCompliantDemands = demands.filter(d => {
            if (!d.deadline) return true; // No deadline = Compliant? Or ignore? Let's say compliant.
            const isLate = d.statuses?.name.toLowerCase() === 'atrasado'; // Explicit status
            // Or check date
            const deadlineDate = new Date(d.deadline);
            const isPastDeadline = deadlineDate < now && d.statuses?.name.toLowerCase() !== 'concluído';
            return !isLate && !isPastDeadline;
        });
        const globalSLA = demands.length > 0 ? (slaCompliantDemands.length / demands.length) * 100 : 100;

        // 3. User Specific Stats (Designer)
        const myDemands = demands.filter(d => d.responsible_id === currentUser?.id);
        const myCompleted = myDemands.filter(d => d.statuses?.name.toLowerCase() === 'concluído');

        const myLeadTimes = myDemands
            .map(d => calculateLeadTime(d.id, d.created_at))
            .filter((t): t is number => t !== null);

        const myAvgLeadTime = myLeadTimes.length > 0
            ? myLeadTimes.reduce((a, b) => a + b, 0) / myLeadTimes.length
            : 0;

        const mySlaCompliant = myDemands.filter(d => {
            if (!d.deadline) return true;
            const deadlineDate = new Date(d.deadline);
            const isPastDeadline = deadlineDate < now && d.statuses?.name.toLowerCase() !== 'concluído';
            return d.statuses?.name.toLowerCase() !== 'atrasado' && !isPastDeadline;
        });
        const mySlaParam = myDemands.length > 0 ? (mySlaCompliant.length / myDemands.length) * 100 : 100;

        // My Work Distribution
        const myDistMap: Record<string, number> = {};
        myDemands.forEach(d => {
            const type = d.demand_types?.name || 'Outros';
            myDistMap[type] = (myDistMap[type] || 0) + 1;
        });
        const myDistribution = Object.entries(myDistMap).map(([name, value]) => ({ name, value }));

        // My Timeline (Mocking purely for visual proof of concept if logs insufficient for daily)
        const myTimeline = [
            { name: 'Seg', value: 2 },
            { name: 'Ter', value: 4 },
            { name: 'Qua', value: 5 }, // "Pico produtividade"
            { name: 'Qui', value: 3 },
            { name: 'Sex', value: 2 },
        ];

        // Revisions (Count times moved to 'Revisão')
        // We check logs for currentUser's demands where action=UPDATE and new status = Revisão
        const myLogs = logs.filter(l => myDemands.some(d => d.id === l.record_id));
        const revisionsCount = myLogs.filter(l => {
            if (l.action !== 'UPDATE') return false;
            try {
                const details = typeof l.details === 'string' ? JSON.parse(l.details) : l.details;
                if (JSON.stringify(details).toLowerCase().includes('revisão')) return true;
                if (details?.status_id) {
                    const name = statusMapId[details.status_id];
                    if (name && name.includes('revisão')) return true;
                }
                return false;
            } catch (e) {
                return false;
            }
        }).length;
        const avgRevisions = myCompleted.length > 0 ? revisionsCount / myCompleted.length : 0;


        // 4. Manager Stats
        const activeDemands = demands.filter(d => !['concluído', 'cancelado'].includes(d.statuses?.name?.toLowerCase() || ''));

        // Status Breakout
        const statusMap: Record<string, number> = {};
        activeDemands.forEach(d => {
            const s = d.statuses?.name || 'Sem Status';
            statusMap[s] = (statusMap[s] || 0) + 1;
        });
        const byStatus = Object.entries(statusMap).map(([name, value]) => ({
            name,
            value,
            color: name.toLowerCase().includes('atrasado') ? '#ef4444' : '#bcd200'
        }));

        // Team Workload
        const userLoadMap: Record<string, { count: number; avatar: string }> = {};
        activeDemands.forEach(d => {
            if (d.profiles?.name) {
                if (!userLoadMap[d.profiles.name]) userLoadMap[d.profiles.name] = { count: 0, avatar: d.profiles.avatar_url };
                userLoadMap[d.profiles.name].count++;
            }
        });
        const teamWorkload = Object.entries(userLoadMap)
            .map(([name, data]) => ({
                name,
                tasks: data.count,
                capacityPct: Math.min((data.count / 10) * 100, 100), // Assuming max 10 tasks capacity
                avatar: data.avatar
            }))
            .sort((a, b) => b.tasks - a.tasks);

        const atRiskCount = activeDemands.filter(d =>
            (d.priorities?.name.toLowerCase() === 'urgente' || d.priorities?.name.toLowerCase() === 'alta') &&
            d.deadline && new Date(d.deadline) <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // Within 3 days
        ).length;

        // Insights Generation
        const designerInsights = [];
        if (myAvgLeadTime < avgLeadTimeGlobal) designerInsights.push("Seu lead time está abaixo da média do time. Ótimo trabalho!");
        else designerInsights.push("Seu lead time está ligeiramente acima da média.");

        const mostFrequentType = myDistribution.sort((a, b) => b.value - a.value)[0];
        if (mostFrequentType) designerInsights.push(`${mostFrequentType.name} representam a maior parte do seu esforço.`);

        const managerInsights = [];
        if (mostFrequentType) managerInsights.push(`${mostFrequentType.name} concentram a maior parte das demandas ativas.`);
        const overloadedUser = teamWorkload[0];
        if (overloadedUser && teamWorkload.length > 1) managerInsights.push(`${overloadedUser.name.split(' ')[0]} está com ${Math.round(overloadedUser.capacityPct)}% da carga provável.`);
        if (atRiskCount > 0) managerInsights.push(`${atRiskCount} demandas de alta prioridade estão próximas do prazo.`);

        const executiveInsights = [];
        executiveInsights.push(`A eficiência operacional (SLA) está em ${Math.round(globalSLA)}%.`);

        // Type Distribution (Global)
        const typeMap: Record<string, number> = {};
        demands.forEach(d => {
            const t = d.demand_types?.name || 'Outros';
            typeMap[t] = (typeMap[t] || 0) + 1;
        });
        const typeDistribution = Object.entries(typeMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5

        return {
            designer: {
                completedCount: myCompleted.length,
                slaCompliance: Math.round(mySlaParam),
                avgLeadTime: Number(myAvgLeadTime.toFixed(1)),
                activeCount: myDemands.length - myCompleted.length,
                distribution: myDistribution,
                productionTimeline: myTimeline,
                revisionsAvg: Number(avgRevisions.toFixed(1)),
                insights: designerInsights
            },
            manager: {
                totalActive: activeDemands.length,
                byStatus,
                teamWorkload,
                atRiskCount,
                avgTimeByStatus: [], // Placeholder complexity
                insights: managerInsights
            },
            executive: {
                totalDemands: demands.length,
                globalLeadTime: Number(avgLeadTimeGlobal.toFixed(1)),
                globalSLA: Math.round(globalSLA),
                efficiencyTrend: 12, // Mocked positive trend
                typeDistribution,
                insights: executiveInsights
            }
        };
    }, [demands, logs, currentUser]);

    return stats;
};
