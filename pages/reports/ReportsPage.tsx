import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import { fetchDemands } from '../../lib/api';
import { LayoutDashboard, Users, User, Clock, Lightbulb, RefreshCw } from 'lucide-react';
import { GeneralReportTab } from './tabs/GeneralReportTab';
import { TeamReportTab } from './tabs/TeamReportTab';
import { DesignerReportTab } from './tabs/DesignerReportTab';
import { TimeReportTab } from './tabs/TimeReportTab';
import { InsightsReportTab } from './tabs/InsightsReportTab';
import { DateRangeFilter, DateRange, getDateRangeFromType } from '../../components/reports/DateRangeFilter';
import { ExportButton, formatReportDataForExport, exportToCSV } from '../../components/reports/ExportButton';
import { ComparisonMetric, calculatePeriodStats, getPreviousPeriodDates } from '../../components/reports/ComparisonMetric';

type ReportTab = 'geral' | 'time' | 'designer' | 'tempo' | 'insights';

// Fixed filter field - always use updated_at (Data de Conclusão)
const DATE_FILTER_FIELD = 'updated_at';

const ReportsPage = () => {
    const [demands, setDemands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<ReportTab>('geral');
    const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromType('30d'));

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        const data = await fetchDemands();
        setDemands(data || []);

        if (!silent) setLoading(false);
        else setRefreshing(false);
    };

    // Filter demands by date range based on selected field
    const filteredDemands = useMemo(() => {
        if (!dateRange.startDate || !dateRange.endDate) return demands;

        // Parse dates without timezone issues
        const startParts = dateRange.startDate.split('-');
        const endParts = dateRange.endDate.split('-');

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

        return demands.filter(d => {
            if (!d[DATE_FILTER_FIELD]) return false;

            const dateParts = d[DATE_FILTER_FIELD].split('T')[0].split('-');
            const dateValue = new Date(
                parseInt(dateParts[0]),
                parseInt(dateParts[1]) - 1,
                parseInt(dateParts[2]),
                12, 0, 0 // Use noon to avoid edge cases
            );

            return dateValue >= start && dateValue <= end;
        });
    }, [demands, dateRange]);

    // Calculate comparison stats
    const comparisonStats = useMemo(() => {
        const currentStats = calculatePeriodStats(demands, dateRange.startDate, dateRange.endDate, DATE_FILTER_FIELD);
        const prevPeriod = getPreviousPeriodDates(dateRange.startDate, dateRange.endDate);
        const previousStats = prevPeriod
            ? calculatePeriodStats(demands, prevPeriod.start, prevPeriod.end, DATE_FILTER_FIELD)
            : { total: 0, completed: 0, delayed: 0, avgLeadTime: 0, onTimeRate: 0 };

        return { current: currentStats, previous: previousStats };
    }, [demands, dateRange]);

    const handleExportCSV = () => {
        const exportData = formatReportDataForExport(filteredDemands);
        exportToCSV(exportData, `relatorio_${activeTab}`);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center h-screen bg-zinc-950 text-white">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-zinc-500">Carregando dados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
            <Header title="Relatórios" subtitle="Análise de Performance e Métricas" />

            {/* Toolbar with Filters */}
            <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm px-4 md:px-8 py-4">
                <div className="max-w-7xl mx-auto">
                    {/* Date Filter and Export Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <DateRangeFilter value={dateRange} onChange={setDateRange} />
                            <button
                                onClick={() => loadData(true)}
                                disabled={refreshing}
                                className="p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
                                title="Atualizar dados"
                            >
                                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <ExportButton onExportCSV={handleExportCSV} />
                    </div>

                    {/* Comparison Stats Row */}
                    {dateRange.type !== 'all' && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-zinc-800/30 rounded-xl border border-zinc-800/50">
                            <ComparisonMetric
                                label="Total"
                                currentValue={comparisonStats.current.total}
                                previousValue={comparisonStats.previous.total}
                            />
                            <ComparisonMetric
                                label="Concluídas"
                                currentValue={comparisonStats.current.completed}
                                previousValue={comparisonStats.previous.completed}
                            />
                            <ComparisonMetric
                                label="Atrasadas"
                                currentValue={comparisonStats.current.delayed}
                                previousValue={comparisonStats.previous.delayed}
                                invertColors={true}
                            />
                            <ComparisonMetric
                                label="Lead Time"
                                currentValue={comparisonStats.current.avgLeadTime}
                                previousValue={comparisonStats.previous.avgLeadTime}
                                format="days"
                                invertColors={true}
                            />
                            <ComparisonMetric
                                label="No Prazo"
                                currentValue={comparisonStats.current.onTimeRate}
                                previousValue={comparisonStats.previous.onTimeRate}
                                format="percent"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs Header */}
            <div className="border-b border-zinc-800 bg-zinc-900/30 px-4 md:px-8">
                <div className="max-w-7xl mx-auto flex overflow-x-auto gap-1 py-1 no-scrollbar">
                    <button
                        onClick={() => setActiveTab('geral')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'geral'
                            ? 'text-primary border-primary'
                            : 'text-zinc-500 border-transparent hover:text-white hover:border-zinc-700'
                            }`}
                    >
                        <LayoutDashboard size={18} />
                        Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('time')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'time'
                            ? 'text-primary border-primary'
                            : 'text-zinc-500 border-transparent hover:text-white hover:border-zinc-700'
                            }`}
                    >
                        <Users size={18} />
                        Time
                    </button>
                    <button
                        onClick={() => setActiveTab('designer')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'designer'
                            ? 'text-primary border-primary'
                            : 'text-zinc-500 border-transparent hover:text-white hover:border-zinc-700'
                            }`}
                    >
                        <User size={18} />
                        Designer
                    </button>
                    <button
                        onClick={() => setActiveTab('tempo')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'tempo'
                            ? 'text-primary border-primary'
                            : 'text-zinc-500 border-transparent hover:text-white hover:border-zinc-700'
                            }`}
                    >
                        <Clock size={18} />
                        Tempo
                    </button>
                    <button
                        onClick={() => setActiveTab('insights')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'insights'
                            ? 'text-primary border-primary'
                            : 'text-zinc-500 border-transparent hover:text-white hover:border-zinc-700'
                            }`}
                    >
                        <Lightbulb size={18} />
                        Insights
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-7xl mx-auto">

                    {activeTab === 'geral' && <GeneralReportTab demands={filteredDemands} />}
                    {activeTab === 'time' && <TeamReportTab demands={filteredDemands} />}
                    {activeTab === 'designer' && <DesignerReportTab demands={filteredDemands} />}
                    {activeTab === 'tempo' && <TimeReportTab demands={filteredDemands} />}
                    {activeTab === 'insights' && <InsightsReportTab demands={filteredDemands} />}

                </div>
            </div>
        </div>
    );
};

export default ReportsPage;

