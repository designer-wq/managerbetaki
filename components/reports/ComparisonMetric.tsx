import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonMetricProps {
    label: string;
    currentValue: number;
    previousValue: number;
    format?: 'number' | 'percent' | 'days';
    invertColors?: boolean; // If true, lower is better (e.g., delay rate)
    showTrend?: boolean;
    className?: string;
}

export const ComparisonMetric: React.FC<ComparisonMetricProps> = ({
    label,
    currentValue,
    previousValue,
    format = 'number',
    invertColors = false,
    showTrend = true,
    className = ''
}) => {
    const diff = currentValue - previousValue;
    const percentChange = previousValue > 0 ? Math.round((diff / previousValue) * 100) : (currentValue > 0 ? 100 : 0);

    // Determine if change is positive or negative (considering inversion)
    const isPositive = invertColors ? diff < 0 : diff > 0;
    const isNegative = invertColors ? diff > 0 : diff < 0;
    const isNeutral = diff === 0;

    const formatValue = (val: number) => {
        switch (format) {
            case 'percent':
                return `${val}%`;
            case 'days':
                return `${val.toFixed(1)}d`;
            default:
                return val.toLocaleString('pt-BR');
        }
    };

    const getTrendIcon = () => {
        if (isNeutral) return <Minus size={14} />;
        if (isPositive) return <TrendingUp size={14} />;
        return <TrendingDown size={14} />;
    };

    const getTrendColor = () => {
        if (isNeutral) return 'text-zinc-400 bg-zinc-500/10';
        if (isPositive) return 'text-emerald-500 bg-emerald-500/10';
        return 'text-red-500 bg-red-500/10';
    };

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">{label}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{formatValue(currentValue)}</span>
                {showTrend && (
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${getTrendColor()}`}>
                        {getTrendIcon()}
                        {isNeutral ? '0%' : `${percentChange > 0 ? '+' : ''}${percentChange}%`}
                    </span>
                )}
            </div>
            <span className="text-xs text-zinc-600">
                vs período anterior: {formatValue(previousValue)}
            </span>
        </div>
    );
};

// Helper function to calculate comparison stats
export interface PeriodStats {
    total: number;
    completed: number;
    delayed: number;
    avgLeadTime: number;
    onTimeRate: number;
}

export const calculatePeriodStats = (demands: any[], startDate: string | null, endDate: string | null, dateField: string = 'created_at'): PeriodStats => {
    // Status considered as "completed" per user request:
    // agendado, postar, ap.gerente, concluido
    const isStatusCompleted = (s: string) => {
        const status = s?.toLowerCase() || '';
        return status.includes('conclu') ||
            status.includes('entregue') ||
            status.includes('finalizado') ||
            status.includes('postar') ||
            status.includes('agendado') ||
            status.includes('ap.gerente') ||
            status.includes('ap. gerente') ||
            status.includes('gerente'); // Also catch variations
    };

    let filtered = demands;

    if (startDate && endDate) {
        // Parse dates without timezone issues
        const startParts = startDate.split('-');
        const endParts = endDate.split('-');

        const start = new Date(
            parseInt(startParts[0]),
            parseInt(startParts[1]) - 1,
            parseInt(startParts[2]),
            0, 0, 0
        );

        const end = new Date(
            parseInt(endParts[0]),
            parseInt(endParts[1]) - 1,
            parseInt(endParts[2]),
            23, 59, 59
        );

        filtered = demands.filter(d => {
            if (!d[dateField]) return false;

            const dateParts = d[dateField].split('T')[0].split('-');
            const dateValue = new Date(
                parseInt(dateParts[0]),
                parseInt(dateParts[1]) - 1,
                parseInt(dateParts[2]),
                12, 0, 0 // Use noon to avoid edge cases
            );

            return dateValue >= start && dateValue <= end;
        });
    }

    let completedCount = 0;
    let delayedCount = 0;
    let onTimeCount = 0;
    let totalLeadTime = 0;
    let leadTimeCount = 0;
    const now = new Date();

    filtered.forEach(d => {
        const s = d.statuses?.name || '';
        const isComp = isStatusCompleted(s);

        if (isComp) {
            completedCount++;

            // Calculate lead time
            const start = new Date(d.created_at);
            const end = d.updated_at ? new Date(d.updated_at) : new Date();
            const leadTime = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            totalLeadTime += leadTime;
            leadTimeCount++;

            // Check if on time
            if (d.deadline) {
                const deadline = new Date(d.deadline);
                deadline.setHours(23, 59, 59, 999);
                if (end <= deadline) onTimeCount++;
            } else {
                onTimeCount++;
            }
        } else {
            // Check if delayed (not completed and past deadline)
            if (d.deadline) {
                const deadline = new Date(d.deadline);
                deadline.setHours(23, 59, 59, 999);
                if (now > deadline) delayedCount++;
            }
        }
    });

    return {
        total: filtered.length,
        completed: completedCount,
        delayed: delayedCount,
        avgLeadTime: leadTimeCount > 0 ? totalLeadTime / leadTimeCount : 0,
        onTimeRate: completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 100
    };
};

// Get previous period dates
export const getPreviousPeriodDates = (startDate: string | null, endDate: string | null): { start: string; end: string } | null => {
    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays);

    return {
        start: prevStart.toISOString().split('T')[0],
        end: prevEnd.toISOString().split('T')[0]
    };
};

export default ComparisonMetric;
