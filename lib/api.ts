import { getSupabase } from './supabase';
import { getNowISO, getDaysAgoSP, toISOStringSP } from './timezone';

// Define types matching our schema
export interface LogEntry {
    user_id?: string;
    action: string;
    table_name: string;
    record_id?: string;
    details?: any;
}

export const logAction = async (entry: LogEntry) => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
        await (supabase as any).from('logs').insert([entry]);
    } catch (error) {
        console.error('Failed to log action:', error);
    }
};

// Generic Fetcher
export const fetchTable = async (tableName: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];

    let { data, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: false });
    if (error) {
        const fallback = await supabase.from(tableName).select('*');
        if (fallback.error) {
            console.error(`Error fetching ${tableName}:`, fallback.error);
            return [];
        }
        return fallback.data || [];
    }
    return data || [];
};

// Relation Fetcher for Demands
export const fetchDemands = async () => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('demands')
        .select(`
            *,
            origins ( name ),
            demand_types ( name ),
            statuses ( name, color, "order" ),
            responsible:profiles!demands_responsible_id_fkey ( name, avatar_url )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching demands:', error);
        return [];
    }
    return data;
};

export const fetchByColumn = async (tableName: string, column: string, value: any) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(column, value)
        .single();

    if (error) {
        // console.error(`Error fetching ${tableName} by ${column}:`, error); // Silence error for auth checks (user not found)
        return null;
    }
    return data;
};

// Generic Creator
export const createRecord = async (tableName: string, record: any, userId?: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await (supabase as any)
        .from(tableName)
        .insert([record])
        .select()
        .single();

    if (error) {
        console.error(`Error creating record in ${tableName}:`, error);
        throw error;
    }

    // Log the action
    if (userId) {
        await logAction({
            user_id: userId,
            action: 'CREATE',
            table_name: tableName,
            record_id: data?.id,
            details: record
        });
    }

    return data;
};

// Generic Updater
export const updateRecord = async (tableName: string, id: string, updates: any, userId?: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    // Compute diffs for logging (string fields only)
    const computeTextDelta = (oldText: string, newText: string) => {
        if (typeof oldText !== 'string' || typeof newText !== 'string') return null;
        if (oldText === newText) return null;
        let p = 0;
        const minLen = Math.min(oldText.length, newText.length);
        while (p < minLen && oldText[p] === newText[p]) p++;
        let s = 0;
        while (s < minLen - p && oldText[oldText.length - 1 - s] === newText[newText.length - 1 - s]) s++;
        const delta = newText.slice(p, newText.length - s);
        return delta;
    };

    // Fetch current record to build structured diff
    let current: any = null;
    try {
        const { data: currentData } = await (supabase as any)
            .from(tableName)
            .select('*')
            .eq('id', id)
            .single();
        current = currentData || null;
    } catch (_) {
        current = null;
    }

    const { data, error } = await (supabase as any)
        .from(tableName)
        .update({ ...updates, updated_at: getNowISO() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error(`Error updating record in ${tableName}:`, error);
        throw error;
    }

    // Log the action
    if (userId) {
        const detailsForLog: any = { ...updates };
        if (current && typeof updates === 'object') {
            Object.keys(updates).forEach((key) => {
                const before = (current as any)?.[key];
                const after = (updates as any)?.[key];
                if (typeof before === 'string' && typeof after === 'string') {
                    const delta = computeTextDelta(before, after);
                    if (delta && delta.trim().length > 0) {
                        if (key === 'description') {
                            detailsForLog.description_delta = delta;
                        } else {
                            if (!detailsForLog.__diff) detailsForLog.__diff = {};
                            detailsForLog.__diff[key] = { delta };
                        }
                    }
                }
            });
        }
        await logAction({
            user_id: userId,
            action: 'UPDATE',
            table_name: tableName,
            record_id: id,
            details: detailsForLog
        });
    }

    return data;
};

// Generic Deleter
export const deleteRecord = async (tableName: string, id: string, userId?: string) => {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq('id', id);

    if (error) {
        console.error(`Error deleting record from ${tableName}:`, error);
        throw error;
    }

    // Log the action
    if (userId) {
        await logAction({
            user_id: userId,
            action: 'DELETE',
            table_name: tableName,
            record_id: id
        });
    }

    return true;
};

// Fetch Comments for a Demand
export const fetchComments = async (demandId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('comments')
        .select(`
            *,
            profiles ( name, avatar_url )
        `)
        .eq('demand_id', demandId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching comments:', error);
        return [];
    }
    return data;
};

// Fetch Logs for a Record
export const fetchLogs = async (recordId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('logs')
        .select(`
            *,
            profiles ( name )
        `)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching logs:', error);
        return [];
    }
    return data;
};

// Fetch All Logs (for Analytics)
// Limited to last 30 days by default to avoid performance hit
export const fetchAllLogs = async (days = 30) => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const date = getDaysAgoSP(days);

    const { data, error } = await supabase
        .from('logs')
        .select('id, record_id, action, details, created_at')
        .gte('created_at', toISOStringSP(date))
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all logs:', error);
        return [];
    }
    return data;
};

// Fetch recent comments across all demands
export const fetchRecentComments = async (days = 30) => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const date = getDaysAgoSP(days);

    const { data, error } = await supabase
        .from('comments')
        .select(`
            id,
            demand_id,
            content,
            created_at,
            profiles ( name )
        `)
        .gte('created_at', toISOStringSP(date))
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching recent comments:', error);
        return [];
    }
    return data;
};

export const fetchRecentMentions = async (days = 30) => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const date = getDaysAgoSP(days);

    const { data, error } = await supabase
        .from('comments')
        .select(`
            id,
            demand_id,
            content,
            created_at,
            profiles ( name )
        `)
        .gte('created_at', toISOStringSP(date))
        .ilike('content', '%@%')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching mentions:', error);
        return [];
    }
    return data;
};

export const fetchDemandsByIds = async (ids: string[]) => {
    const supabase = getSupabase();
    if (!supabase || !ids || ids.length === 0) return [];
    const { data, error } = await (supabase as any)
        .from('demands')
        .select(`
            id,
            title,
            statuses ( name, color )
        `)
        .in('id', ids);
    if (error) {
        console.error('Error fetching demands by ids:', error);
        return [];
    }
    return data || [];
};

// Fetch Profiles with Job Titles
export const fetchProfiles = async () => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error fetching profiles:', error);
        return [];
    }
    return data || [];
};

// Fetch Auth Users List (RPC)
export const fetchAuthUsersList = async () => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('get_auth_users_list');
    if (error) {
        console.error('Error fetching auth users list:', error);
        return [];
    }
    return data || [];
};

// Generic Upsert (useful for permissions)
export const upsertRecord = async (tableName: string, record: any, onConflict: string, userId?: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await (supabase as any)
        .from(tableName)
        .upsert(record, { onConflict })
        .select()
        .single();

    if (error) {
        console.error(`Error upserting record in ${tableName}:`, error);
        throw error;
    }

    // Log the action (Simplify to UPSERT action)
    if (userId) {
        await logAction({
            user_id: userId,
            action: 'UPSERT',
            table_name: tableName,
            record_id: data?.id,
            details: record
        });
    }

    return data;
};
export const fetchExecutiveKpis = async (periodStart: string, periodEnd: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    // Fetch demands based on DEADLINE (Prazo)
    const { data: demands, error } = await supabase
        .from('demands')
        .select(`
            *,
            demand_types ( name ),
            statuses ( name ),
            responsible:profiles!demands_responsible_id_fkey ( name )
        `)
        .gte('deadline', periodStart)
        .lte('deadline', periodEnd);

    if (error) {
        console.error('Error fetching executive data:', error);
        return null;
    }

    if (!demands) return null;

    let total_demands = demands.length;
    let deliveries_count = 0;
    let sla_ok = 0;
    let sla_nok = 0;
    let backlog_count = 0;
    let wip_count = 0;

    // Lead Time Stats
    const typeStats: Record<string, { totalMinutes: number; count: number }> = {};
    const designerStats: Record<string, { totalMinutes: number; count: number }> = {};
    let globalTotalMinutes = 0;
    let leadTimeCount = 0;

    demands.forEach((d: any) => {
        const status = d.statuses?.name?.toLowerCase() || '';
        const isCompleted = status.includes('conclu') ||
            status.includes('entregue') ||
            status.includes('finalizado') ||
            status.includes('postar') ||
            status.includes('agendado') ||
            status.includes('ag.odds') ||
            status.includes('ag,odds') ||
            status.includes('ag. odds') ||
            status.includes('ap.gerente') ||
            status.includes('ap. gerente') ||
            status.includes('gerente');

        // Deliveries
        if (isCompleted) {
            deliveries_count++;
        }


        // SLA Calculation
        if (d.deadline) {
            const deadlineDate = new Date(d.deadline);
            // Set deadline to end of day
            deadlineDate.setHours(23, 59, 59, 999);

            let finishedDate = d.finished_at ? new Date(d.finished_at) : null;

            if (isCompleted) {
                if (finishedDate && finishedDate <= deadlineDate) {
                    sla_ok++;
                } else if (!finishedDate) {
                    // If completed but no finished_at, assume OK (fallback)
                    sla_ok++;
                } else {
                    sla_nok++;
                }
            } else {
                // Not completed - use São Paulo timezone for current date
                const { getSaoPauloDate } = require('./timezone');
                if (getSaoPauloDate() > deadlineDate) sla_nok++;
                // Pending items not overdue are neutral for "Met SLA" vs "Missed SLA" count usually,
                // but for "Global Efficiency", we might want (OK / (OK + NOK)).
                // If we include pending in denominator, efficiency drops.
                // Let's stick to counting NOK if overdue.
            }
        }

        // Status Counts
        if (status.includes('backlog') || status.includes('fila') || status.includes('pendente')) {
            backlog_count++;
        } else if (status.includes('produção') || status.includes('revisão') || status.includes('andamento') || status.includes('alteração')) {
            wip_count++;
        }

        // Lead Time Calculation (Using accumulated_time for actual work time)
        if (isCompleted) {
            // accumulated_time is in seconds. Convert to minutes.
            const workMinutes = d.accumulated_time ? d.accumulated_time / 60 : 0;

            // Only count if there is some recorded time, or if we want to count 0s?
            // Usually we want average of recorded times.
            // If workMinutes is 0, it might drag down average incorrectly if they just forgot to timer.
            // But user said "sum of individual timer".

            globalTotalMinutes += workMinutes;
            leadTimeCount++;

            // Type Stats
            const typeName = d.demand_types?.name || 'Outros';
            if (!typeStats[typeName]) typeStats[typeName] = { totalMinutes: 0, count: 0 };
            typeStats[typeName].totalMinutes += workMinutes;
            typeStats[typeName].count += 1;

            // Designer Stats
            const designerName = d.responsible?.name || 'Não atribuído';
            if (!designerStats[designerName]) designerStats[designerName] = { totalMinutes: 0, count: 0 };
            designerStats[designerName].totalMinutes += workMinutes;
            designerStats[designerName].count += 1;
        }
    });

    const lead_time_avg_by_type = Object.entries(typeStats).map(([name, stats]) => ({
        name,
        avg_days: stats.count > 0 ? parseFloat((stats.totalMinutes / stats.count).toFixed(2)) : 0, // Keeping key 'avg_days' for compatibility but value is Minutes
        deliveries: stats.count
    }));

    const lead_time_avg_by_designer = Object.entries(designerStats).map(([name, stats]) => ({
        name,
        avg_days: stats.count > 0 ? parseFloat((stats.totalMinutes / stats.count).toFixed(2)) : 0, // Value is Minutes
        total_minutes: stats.totalMinutes,
        deliveries: stats.count
    }));

    // Calculate SLA %
    const totalSla = sla_ok + sla_nok;
    const sla_percentage = totalSla > 0 ? Math.round((sla_ok / totalSla) * 100) : 0;

    return {
        total_demands,
        deliveries_count,
        sla_ok,
        sla_nok,
        globalSLA: sla_percentage, // Return pre-calculated percentage
        backlog_count,
        wip_count,
        lead_time_total_days: leadTimeCount > 0 ? parseFloat((globalTotalMinutes / leadTimeCount).toFixed(2)) : 0, // Value is Minutes
        lead_time_avg_by_type,
        lead_time_avg_by_designer
    };
};
export const fetchExecutiveInsights = async (periodStart: string, periodEnd: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await (supabase as any).rpc('executive_insights', {
        period_start: periodStart,
        period_end: periodEnd
    });
    if (error) {
        console.error('Error fetching executive insights:', error);
        return [];
    }
    // Supabase returns array of rows like { text: '...' }
    return (data || []).map((row: any) => row.text).filter(Boolean);
};
