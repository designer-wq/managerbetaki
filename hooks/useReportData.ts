import { useState, useEffect, useCallback } from 'react';
import { fetchDemands, fetchAllLogs, fetchTable } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export const useReportData = (period: string) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [demands, setDemands] = useState<any[]>([]);
    const [myDemands, setMyDemands] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);

    const getDates = useCallback(() => {
        const end = new Date();
        const start = new Date();

        if (period === '30 Dias') {
            start.setDate(end.getDate() - 30);
        } else if (period === 'Mês Atual') {
            start.setDate(1);
        } else if (period === 'Semana') {
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
            start.setDate(diff);
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    }, [period]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Parallel fetch
                const [allDemands, allLogs, allStatuses] = await Promise.all([
                    fetchDemands(),
                    fetchAllLogs(60), // Last 60 days for logs to catch recent rework
                    fetchTable('statuses')
                ]);

                if (!allDemands) {
                    setDemands([]);
                    setMyDemands([]);
                    return;
                }

                setDemands(allDemands);
                setLogs(allLogs || []);
                setStatuses(allStatuses || []);

                if (user?.id) {
                    const my = allDemands.filter((d: any) => d.responsible_id === user.id);
                    setMyDemands(my);
                }

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [period, getDates, user]);

    const calculateRetrabalho = useCallback((targetDemands: any[]) => {
        if (!logs.length || !statuses.length) return 0;
        
        const { start, end } = getDates();

        const doneStatusIds = statuses
            .filter(s => {
                const name = s.name.toLowerCase();
                return name.includes('entregue') || name.includes('finaliz') || name.includes('conclu');
            })
            .map(s => s.id);

        let reworkCount = 0;

        targetDemands.forEach(demand => {
            const demandLogs = logs
                .filter(l => l.record_id === demand.id)
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            let wasDone = false;

            // Initialize wasDone based on first log if possible? 
            // Or assume false. If it was created as Done, the first log might show it?
            // Usually starts as 'Not Done'.

            demandLogs.forEach(log => {
                const logDate = new Date(log.created_at);
                
                if (log.action === 'UPDATE' && log.details?.status_id) {
                    const newStatusId = log.details.status_id;
                    const isDone = doneStatusIds.includes(newStatusId);

                    // Transition FROM Done TO Not Done = Rework
                    if (wasDone && !isDone) {
                        // Count if event happened in period
                        if (logDate >= start && logDate <= end) {
                            reworkCount++;
                        }
                    }
                    
                    wasDone = isDone;
                }
            });
        });

        return reworkCount;
    }, [logs, statuses, getDates]);

    return { loading, demands, myDemands, logs, statuses, dateRange: getDates(), calculateRetrabalho };
};
