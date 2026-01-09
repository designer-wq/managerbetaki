import React from 'react';
import { Clock } from 'lucide-react';
import { useDemandTimer } from '../../hooks/useDemandTimer';

interface DemandTimerBadgeProps {
    statusName?: string;
    productionStartedAt?: string | null;
    accumulatedTime?: number;
    className?: string;
}

const DemandTimerBadge: React.FC<DemandTimerBadgeProps> = ({
    statusName,
    productionStartedAt,
    accumulatedTime = 0,
    className = ""
}) => {
    const { time, isRunning } = useDemandTimer({
        statusName,
        productionStartedAt,
        accumulatedTime
    });

    if (!isRunning && accumulatedTime === 0) return null;

    return (
        <div className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-mono font-medium transition-all
            ${isRunning
                ? 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_10px_rgba(188,210,0,0.1)]'
                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400'}
            ${className}
        `}>
            <Clock size={13} className={isRunning ? "animate-pulse" : ""} />
            <span className="tabular-nums tracking-wide">{time}</span>
        </div>
    );
};

export default DemandTimerBadge;
