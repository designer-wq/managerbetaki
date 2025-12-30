import { DemandRow, DateFilter } from './types';

// Helper: Parse date (handle ISO strings)
export const parseDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr);
};

// Helper: Difference in days
export const diffDays = (d1: Date, d2: Date) => {
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return diffTime / (1000 * 60 * 60 * 24);
};

// Helper: Check if date is in range
export const checkInRange = (dateStr: string | null, filter?: DateFilter) => {
    if (!filter || filter.type === 'all' || !filter.startDate || !filter.endDate) return true;
    if (!dateStr) return false;

    // Simple string comparison for ISO dates YYYY-MM-DD
    const date = dateStr.split('T')[0];
    return date >= filter.startDate && date <= filter.endDate;
};

// Helper: Check if status counts as "Completed"
export const isStatusCompleted = (statusName?: string) => {
    const s = statusName?.toLowerCase() || '';
    return s.includes('conclu') || // concluido, concluído, concluídos
        s.includes('entregue') ||
        s.includes('finalizado') ||
        s.includes('postar') ||
        s.includes('agendado') ||
        s.includes('ag.odds') ||
        s.includes('ag,odds') ||
        s.includes('ag. odds') ||
        s.includes('ap.gerente') ||
        s.includes('ap. gerente') ||
        s.includes('gerente');
};

// Helper: Check if status counts as "Active" (Not completed, Not canceled)
export const isStatusActive = (statusName?: string) => {
    const s = statusName?.toLowerCase() || '';
    return !isStatusCompleted(s) && !s.includes('cancel');
};

// 1. Overview Metrics
export const calculateOverviewMetrics = (allDemands: DemandRow[], filter: DateFilter) => {
    // Created: demands CREATED in period
    const created = allDemands.filter(d => checkInRange(d.created_at, filter));

    // Completed: demands FINISHED in period
    const completed = allDemands.filter(d => {
        const status = d.statuses?.name;
        const isComp = isStatusCompleted(status);
        // For 'postar'/'agendado', they might not have finished_at set.
        // If finished_at is missing but status is completed, we should probably check updated_at or assume it's "Done".
        // However, to filter by PERIOD, we need a date.
        // If finished_at is null, fallback to updated_at?
        const dateToCheck = d.finished_at || d.updated_at;
        return isComp && checkInRange(dateToCheck, filter);
    });

    // SLA
    let onTimeCount = 0;
    completed.forEach(d => {
        // If finished_at is missing (e.g. postar), use updated_at or NOW?
        const end = d.finished_at ? parseDate(d.finished_at) : (d.updated_at ? parseDate(d.updated_at) : new Date());
        const deadline = parseDate(d.deadline);

        // If deadline is end of day, adjust
        if (deadline) deadline.setHours(23, 59, 59, 999);

        if (deadline && end && end <= deadline) {
            onTimeCount++;
        } else if (!deadline) {
            onTimeCount++; // No deadline = on time
        }
    });

    const slaPercentage = completed.length > 0 ? (onTimeCount / completed.length) * 100 : 100;

    // Lead Time (created -> completion)
    let totalLeadTime = 0;
    let leadTimeCount = 0;
    completed.forEach(d => {
        const start = parseDate(d.created_at);
        // Fallback if finished_at is null
        const end = d.finished_at ? parseDate(d.finished_at) : (d.updated_at ? parseDate(d.updated_at) : new Date());
        if (start && end) {
            totalLeadTime += diffDays(start, end);
            leadTimeCount++;
        }
    });
    const avgLeadTime = leadTimeCount > 0 ? totalLeadTime / leadTimeCount : 0;

    // Cycle Time (production start -> completion)
    let totalCycleTime = 0;
    let cycleTimeCount = 0;
    completed.forEach(d => {
        if (d.production_started_at) {
            const start = parseDate(d.production_started_at);
            const end = d.finished_at ? parseDate(d.finished_at) : (d.updated_at ? parseDate(d.updated_at) : new Date());
            if (start && end) {
                totalCycleTime += diffDays(start, end);
                cycleTimeCount++;
            }
        }
    });
    const avgCycleTime = cycleTimeCount > 0 ? totalCycleTime / cycleTimeCount : 0;

    // Rework: Snapshot of active demands currently in "Revisão"
    // "Retrabalho só qnd for para o status de revisao"
    const activeDemands = allDemands.filter(d => isStatusActive(d.statuses?.name));

    const inRevision = activeDemands.filter(d =>
        d.statuses?.name?.toLowerCase().includes('revisão') || d.statuses?.name?.toLowerCase().includes('revisao')
    ).length;

    // Rate = (Active in Revision / Total Active) * 100? 
    // Or (Active in Revision / Total items)? Usually "Rework Rate" is "Items needing rework / Total items processed".
    // But without logs, we can only verify current state.
    // Let's stick to (In Revision / Active Demands) for "Current Rework Density".
    const reworkRate = activeDemands.length > 0 ? (inRevision / activeDemands.length) * 100 : 0;

    return {
        totalCreated: created.length,
        totalCompleted: completed.length,
        slaPercentage,
        avgLeadTime,
        avgCycleTime,
        reworkRate,
        inRevision
    };
};

// 2. Productivity Metrics
export const calculateProductivityMetrics = (allDemands: DemandRow[], filter: DateFilter) => {
    // Filter for COMPLETED in period
    const completed = allDemands.filter(d => {
        const status = d.statuses?.name;
        const isComp = isStatusCompleted(status);
        const dateToCheck = d.finished_at || d.updated_at;
        return isComp && checkInRange(dateToCheck, filter);
    });

    // Group by Designer
    const byDesigner: Record<string, { count: number; name: string; onTime: number; totalLead: number }> = {};

    completed.forEach(d => {
        const name = d.responsible?.name || 'Não atribuído';
        if (!byDesigner[name]) byDesigner[name] = { count: 0, name, onTime: 0, totalLead: 0 };

        byDesigner[name].count++;

        // SLA check
        const end = d.finished_at ? parseDate(d.finished_at) : (d.updated_at ? parseDate(d.updated_at) : new Date());
        if (d.deadline) {
            const deadline = parseDate(d.deadline);
            if (deadline) deadline.setHours(23, 59, 59, 999);
            if (deadline && end && end <= deadline) byDesigner[name].onTime++;
        } else {
            byDesigner[name].onTime++;
        }

        // Lead Time
        const start = parseDate(d.created_at);
        if (start && end) {
            byDesigner[name].totalLead += diffDays(start, end);
        }
    });

    return { byDesigner };
};

// 3. Workload Metrics
export const calculateWorkloadMetrics = (allDemands: DemandRow[]) => {
    // Forces Active Only snapshot
    const activeDemands = allDemands.filter(d => isStatusActive(d.statuses?.name));

    const byDesigner: Record<string, { wip: number; stalled: number; }> = {};

    activeDemands.forEach(d => {
        const name = d.responsible?.name || 'Não atribuído';
        if (!byDesigner[name]) byDesigner[name] = { wip: 0, stalled: 0 };

        byDesigner[name].wip++;

        // Stalled Check (needs updated_at)
        if (d.updated_at) {
            const diff = diffDays(new Date(d.updated_at), new Date());
            if (diff > 3) byDesigner[name].stalled++;
        } else {
            // Fallback to created_at
            const diff = diffDays(new Date(d.created_at), new Date());
            if (diff > 3) byDesigner[name].stalled++;
        }
    });

    return { byDesigner };
};
