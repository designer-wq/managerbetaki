import { getSupabase } from './supabase';

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
        await supabase.from('logs').insert([entry]);
    } catch (error) {
        console.error('Failed to log action:', error);
    }
};

// Generic Fetcher
export const fetchTable = async (tableName: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: false });
    if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return [];
    }
    return data;
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
            statuses ( name, color ),
            profiles ( name, avatar_url )
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

    const { data, error } = await supabase
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
            record_id: data.id,
            details: record
        });
    }

    return data;
};

// Generic Updater
export const updateRecord = async (tableName: string, id: string, updates: any, userId?: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error(`Error updating record in ${tableName}:`, error);
        throw error;
    }

    // Log the action
    if (userId) {
        await logAction({
            user_id: userId,
            action: 'UPDATE',
            table_name: tableName,
            record_id: id,
            details: updates
        });
    }

    return data;
};

// Generic Deleter
export const deleteRecord = async (tableName: string, id: string, userId?: string) => {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
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

    const date = new Date();
    date.setDate(date.getDate() - days);

    const { data, error } = await supabase
        .from('logs')
        .select('*')
        .gte('created_at', date.toISOString())
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching all logs:', error);
        return [];
    }
    return data;
};

// Fetch Profiles with Job Titles
export const fetchProfiles = async () => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select(`
            *,
            job_titles ( name )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching profiles:', error);
        return [];
    }
    return data;
};

// Generic Upsert (useful for permissions)
export const upsertRecord = async (tableName: string, record: any, onConflict: string, userId?: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
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
            record_id: data.id,
            details: record
        });
    }

    return data;
};
