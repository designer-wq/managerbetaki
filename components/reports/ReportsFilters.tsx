import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Calendar, Users, Target, Layers, ArrowRight } from 'lucide-react';
import { fetchLists } from '../../lib/reports/queries';
import { ReportsFilterState, DateFilter } from '../../lib/reports/types';

interface ReportsFiltersProps {
    onFilterChange: (filters: ReportsFilterState) => void;
    isLoading?: boolean;
}

const ReportsFilters: React.FC<ReportsFiltersProps> = ({ onFilterChange, isLoading }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [lists, setLists] = useState<any>({ designers: [], types: [], origins: [], statuses: [] });

    // Initial state from URL or Default
    const getInitialState = (): ReportsFilterState => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        return {
            date: {
                type: (searchParams.get('dateType') as any) || 'this_month',
                startDate: searchParams.get('startDate') || startOfMonth.toISOString().split('T')[0],
                endDate: searchParams.get('endDate') || today.toISOString().split('T')[0],
            },
            designerId: searchParams.get('designerId') || 'all',
            typeId: searchParams.get('typeId') || 'all',
            originId: searchParams.get('originId') || 'all',
            statusId: searchParams.get('statusId') || 'all',
        };
    };

    const [filters, setFilters] = useState<ReportsFilterState>(getInitialState);

    useEffect(() => {
        fetchLists().then(setLists);
    }, []);

    // Sync with Parent and URL
    useEffect(() => {
        // 1. Notify Parent
        onFilterChange(filters);

        // 2. Update URL if changed
        const currentParams = Object.fromEntries(searchParams.entries());

        const newParams: Record<string, string> = {
            dateType: filters.date.type,
            designerId: filters.designerId,
            typeId: filters.typeId,
            originId: filters.originId,
            statusId: filters.statusId,
        };

        if (filters.date.startDate) newParams.startDate = filters.date.startDate;
        if (filters.date.endDate) newParams.endDate = filters.date.endDate;

        // Check difference
        const hasChanged = Object.keys(newParams).some(key => newParams[key] !== currentParams[key]) ||
            Object.keys(currentParams).some(key => !newParams.hasOwnProperty(key) && ['startDate', 'endDate'].includes(key));

        if (hasChanged) {
            setSearchParams(newParams, { replace: true });
        }
    }, [filters]);

    const handleDateTypeChange = (type: DateFilter['type']) => {
        const today = new Date();
        let start = null;
        let end = today.toISOString().split('T')[0];

        switch (type) {
            case 'today':
                start = today.toISOString().split('T')[0];
                break;
            case '7d':
                const d7 = new Date(); d7.setDate(d7.getDate() - 7);
                start = d7.toISOString().split('T')[0];
                break;
            case '30d':
                const d30 = new Date(); d30.setDate(d30.getDate() - 30);
                start = d30.toISOString().split('T')[0];
                break;
            case 'this_month':
                start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                break;
            case 'last_month':
                const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                // Last day of last month is Day 0 of this month
                const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                start = firstDayLastMonth.toISOString().split('T')[0];
                end = lastDayLastMonth.toISOString().split('T')[0];
                break;
            case 'custom':
                start = filters.date.startDate;
                end = filters.date.endDate;
                break;
        }

        setFilters(prev => ({ ...prev, date: { type, startDate: start, endDate: end } }));
    };

    return (
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mb-6 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">

                {/* Date Filter */}
                <div className="flex-1 flex gap-2 overflow-x-auto w-full pb-2 md:pb-0 custom-scrollbar">
                    {(['today', '7d', '30d', 'this_month', 'last_month'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => handleDateTypeChange(t)}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.date.type === t
                                ? 'bg-primary text-black font-bold'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                        >
                            {t === 'today' ? 'Hoje' :
                                t === '7d' ? '7 Dias' :
                                    t === '30d' ? '30 Dias' :
                                        t === 'this_month' ? 'Este Mês' :
                                            'Mês Passado'}
                        </button>
                    ))}
                    <div className="h-6 w-px bg-zinc-700 mx-1" />
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={filters.date.startDate || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, date: { ...prev.date, type: 'custom', startDate: e.target.value } }))}
                            className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 w-28"
                        />
                        <span className="text-zinc-600 text-xs">até</span>
                        <input
                            type="date"
                            value={filters.date.endDate || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, date: { ...prev.date, type: 'custom', endDate: e.target.value } }))}
                            className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 w-28"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Designer */}
                <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <select
                        value={filters.designerId}
                        onChange={(e) => setFilters(prev => ({ ...prev, designerId: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-primary outline-none appearance-none"
                    >
                        <option value="all">Todos os Designers</option>
                        {lists.designers.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>

                {/* Type */}
                <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <select
                        value={filters.typeId}
                        onChange={(e) => setFilters(prev => ({ ...prev, typeId: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-primary outline-none appearance-none"
                    >
                        <option value="all">Todos os Tipos</option>
                        {lists.types.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                {/* Origin */}
                <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <select
                        value={filters.originId}
                        onChange={(e) => setFilters(prev => ({ ...prev, originId: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-primary outline-none appearance-none"
                    >
                        <option value="all">Todas as Origens</option>
                        {lists.origins.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                </div>

                {/* Status */}
                <div className="relative">
                    <ArrowRight className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <select
                        value={filters.statusId}
                        onChange={(e) => setFilters(prev => ({ ...prev, statusId: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-primary outline-none appearance-none"
                    >
                        <option value="all">Todos os Status</option>
                        {lists.statuses.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default ReportsFilters;
