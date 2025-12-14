import { useState, useEffect, useRef } from 'react';

interface UseDemandTimerProps {
    statusName?: string;
    productionStartedAt?: string | null;
    accumulatedTime?: number; // In seconds
}

export const useDemandTimer = ({ statusName, productionStartedAt, accumulatedTime = 0 }: UseDemandTimerProps) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(accumulatedTime);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const isProduction = statusName?.toLowerCase().includes('produção') || statusName?.toLowerCase().includes('production');

    useEffect(() => {
        // If not in production, just show accumulated time
        if (!isProduction) {
            setElapsedSeconds(accumulatedTime);
            return;
        }

        // If in production but no start time (shouldn't happen technically if logic is correct, but fallback)
        if (!productionStartedAt) {
            setElapsedSeconds(accumulatedTime);
            return;
        }

        const calculateTime = () => {
            const start = new Date(productionStartedAt).getTime();
            const now = new Date().getTime();
            const currentSessionSeconds = Math.max(0, Math.floor((now - start) / 1000));
            setElapsedSeconds(accumulatedTime + currentSessionSeconds);
        };

        // Calculate immediately
        calculateTime();

        // Set interval
        intervalRef.current = setInterval(calculateTime, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isProduction, productionStartedAt, accumulatedTime]);

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return {
        time: formatTime(elapsedSeconds),
        seconds: elapsedSeconds,
        isRunning: isProduction
    };
};
