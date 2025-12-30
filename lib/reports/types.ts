import { LucideIcon } from 'lucide-react';

export interface DateFilter {
    type: 'all' | 'today' | '7d' | '30d' | 'this_month' | 'last_month' | 'custom';
    startDate: string | null;
    endDate: string | null;
}

export interface ReportsFilterState {
    date: DateFilter;
    designerId: string; // 'all' or uuid
    typeId: string; // 'all' or uuid
    originId: string; // 'all' or uuid
    statusId: string; // 'all' or uuid
}

export interface KpiMetric {
    id: string;
    label: string;
    value: string | number;
    subValue?: string; // e.g., "+5% vs last period"
    icon?: LucideIcon;
    tooltip: string; // The specific tooltip text requested
    trend?: 'up' | 'down' | 'neutral';
    color?: string; // Hex or tailwind class
}

export interface ChartDataPoint {
    name: string;
    value: number;
    [key: string]: any; // For multi-series
}

export interface ReportInsight {
    id: string;
    type: 'positive' | 'negative' | 'neutral' | 'info';
    text: string;
}

// Database Row Types (Inferred)
export interface DemandRow {
    id: string;
    title: string;
    created_at: string;
    finished_at: string | null;
    deadline: string | null;
    responsible_id: string | null;
    status_id: string | null;
    demand_type_id: string | null;
    origin_id: string | null;
    accumulated_time: number | null; // Seconds
    production_started_at: string | null;
    updated_at?: string | null;
    statuses?: {
        name: string;
        color: string | null;
    };
    demand_types?: {
        name: string;
    };
    origins?: {
        name: string;
    };
    responsible?: {
        name: string;
        avatar_url: string | null;
    };
}
