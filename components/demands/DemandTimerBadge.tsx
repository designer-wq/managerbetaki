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
        <div className={`flex items-center gap-1.5 text-xs font-mono font-medium ${isRunning ? 'text-blue-400' : 'text-zinc-500'} ${className}`}>
            <Clock size={12} className={isRunning ? "animate-pulse" : ""} />
            <span>{time}</span>
        </div>
    );
};

export default DemandTimerBadge;
