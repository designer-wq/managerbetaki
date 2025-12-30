import { fetchDemands } from '../api';
import { DemandRow, ReportsFilterState } from './types';
import { getSupabase } from '../supabase';

export const fetchReportDemands = async (filters: ReportsFilterState): Promise<DemandRow[]> => {
    // Reuse the main API function to ensure we get exactly what the Demands page sees
    // This avoids schema/projection mismatches.
    const data = await fetchDemands();

    if (!data) return [];

    let filtered = data as unknown as DemandRow[];

    // Apply Non-Date Filters in memory (since we are fetching everything now)
    // Date filter is applied later in metrics calculation, but strict filters (Designer, Type, etc.) 
    // can be applied here to reduce dataset passed to context.

    if (filters.designerId !== 'all') {
        filtered = filtered.filter(d => d.responsible_id === filters.designerId);
    }
    if (filters.typeId !== 'all') {
        filtered = filtered.filter(d => d.demand_type_id === filters.typeId);
    }
    if (filters.originId !== 'all') {
        filtered = filtered.filter(d => d.origin_id === filters.originId);
    }
    if (filters.statusId !== 'all') {
        filtered = filtered.filter(d => d.status_id === filters.statusId);
    }

    return filtered;
};

export const fetchLists = async () => {
    const supabase = getSupabase();
    if (!supabase) return { designers: [], types: [], origins: [], statuses: [] };

    const [d, t, o, s] = await Promise.all([
        supabase.from('profiles').select('id, name').order('name'),
        supabase.from('demand_types').select('id, name').order('name'),
        supabase.from('origins').select('id, name').order('name'),
        supabase.from('statuses').select('id, name').order('order')
    ]);

    return {
        designers: d.data || [],
        types: t.data || [],
        origins: o.data || [],
        statuses: s.data || []
    };
};
