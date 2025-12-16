import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { ChevronDown, Filter, Download } from 'lucide-react';
import { fetchDemands, fetchAllLogs, fetchExecutiveKpis, fetchExecutiveInsights } from '../lib/api';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../contexts/AuthContext';
import DesignerReports from '../components/reports/DesignerReports';
import ManagerReports from '../components/reports/ManagerReports';
import ExecutiveReports from '../components/reports/ExecutiveReports';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';

type ViewMode = 'executive' | 'operacao' | 'equipe';

const ReportsPage = () => {
  const { user, profile, isAdmin } = useAuth();
  const [demands, setDemands] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [execKpis, setExecKpis] = useState<any | null>(null);
  const [execKpisPrev, setExecKpisPrev] = useState<any | null>(null);
  const [execInsights, setExecInsights] = useState<string[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<any>(null);
  const [monthNames, setMonthNames] = useState<{current: string, previous: string} | null>(null);

  // Determine default view based on role
  // If user is Admin -> Executive
  // If user is Manager -> Manager
  // Else -> Designer
  const [viewMode, setViewMode] = useState<ViewMode>('operacao');

  useEffect(() => {
    if (profile) {
      // Default to Team View ('manager') for everyone as requested
      // "permorcane da equipe aparecer para usuarios comum"
      setViewMode('operacao');
    }
  }, [profile]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [demandsData, logsData] = await Promise.all([
        fetchDemands(),
        fetchAllLogs(90) // Fetch last 90 days for robust stats
      ]);
      setDemands(demandsData || []);
      setLogs(logsData || []);
      setLoading(false);
    };
    loadData();
  }, []);

  const stats = useAnalytics(demands, logs, profile);

  // No local fallback: tudo vem do Supabase via RPC

  useEffect(() => {
    const loadKpis = async () => {
      const now = new Date();
      
      // Current Month (Calendar)
      const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      // Previous Month (Calendar)
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      setMonthNames({
        current: currentStart.toLocaleString('pt-BR', { month: 'long' }),
        previous: prevStart.toLocaleString('pt-BR', { month: 'long' })
      });

      const [current, previous, insights, allDemands] = await Promise.all([
        fetchExecutiveKpis(currentStart.toISOString(), currentEnd.toISOString()),
        fetchExecutiveKpis(prevStart.toISOString(), prevEnd.toISOString()),
        fetchExecutiveInsights(currentStart.toISOString(), currentEnd.toISOString()),
        fetchDemands()
      ]);

      // Calculate Created Demands Count
      const countCreated = (start: Date, end: Date) => {
        return (allDemands || []).filter((d: any) => {
          const created = new Date(d.created_at);
          return created >= start && created <= end;
        }).length;
      };

      setMonthlyComparison({
        created: {
          current: countCreated(currentStart, currentEnd),
          previous: countCreated(prevStart, prevEnd)
        },
        completed: {
          current: current?.deliveries_count ?? 0,
          previous: previous?.deliveries_count ?? 0
        },
        sla: {
          current: current?.globalSLA ?? 0,
          previous: previous?.globalSLA ?? 0
        },
        leadTime: {
          current: current ? current.lead_time_total_days : 0,
          previous: previous ? previous.lead_time_total_days : 0
        }
      });

      setExecKpis(current);
      setExecKpisPrev(previous);
      setExecInsights(insights || []);
    };
    loadKpis();
  }, []);
  
  useRealtimeSubscription(['demands','demand_events'], () => {
    // Re-trigger loadKpis logic (simplified here)
    // For now, we can just reload the page or duplicate the logic.
    // Ideally extract loadKpis to a useCallback but for quick fix:
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    fetchExecutiveKpis(currentStart.toISOString(), currentEnd.toISOString()).then(setExecKpis);
    fetchExecutiveInsights(currentStart.toISOString(), currentEnd.toISOString()).then(setExecInsights);
    // Note: Full comparison reload omitted for brevity in realtime, but main KPIs update.
  });

  const handleTabChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-950">
      <Header title="Relatórios & Análises" />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Abas */}
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => handleTabChange('executive')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'executive' ? 'bg-[#bcd200] text-zinc-900 shadow-lg' : 'text-zinc-400 hover:text-white'}`}
            >
              Visão Executiva
            </button>

            <button
              onClick={() => handleTabChange('operacao')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'operacao' ? 'bg-[#bcd200] text-zinc-900 shadow-lg' : 'text-zinc-400 hover:text-white'}`}
            >
              Operação
            </button>

            <button
              onClick={() => handleTabChange('equipe')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'equipe' ? 'bg-[#bcd200] text-zinc-900 shadow-lg' : 'text-zinc-400 hover:text-white'}`}
            >
              Equipe
            </button>
          </div>

          {/* Filters (Visual Only for now) */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 text-sm hover:text-white transition-colors">
              <Filter size={16} />
              <span>Filtros</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 text-sm hover:text-white transition-colors">
              <Download size={16} />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#bcd200] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="min-h-[500px]">
            {viewMode === 'executive' && (
              <ExecutiveReports
                stats={stats.executive}
                insightsOverride={execInsights}
                kpis={{
                  sla: execKpis?.globalSLA ?? 0,
                  lead: execKpis ? execKpis.lead_time_total_days : 0,
                  deliveries: execKpis?.deliveries_count ?? 0,
                  backlog: execKpis?.backlog_count ?? 0,
                  wip: execKpis?.wip_count ?? 0
                }}
                kpisPrevious={{
                  sla: execKpisPrev?.globalSLA ?? 0,
                  lead: execKpisPrev ? execKpisPrev.lead_time_total_days : 0,
                  deliveries: execKpisPrev?.deliveries_count ?? 0,
                  backlog: execKpisPrev?.backlog_count ?? 0,
                  wip: execKpisPrev?.wip_count ?? 0
                }}
                leadTimeByType={execKpis?.lead_time_avg_by_type ?? []}
                leadTimeByDesigner={execKpis?.lead_time_avg_by_designer ?? []}
                leadTimeByTypePrevious={execKpisPrev?.lead_time_avg_by_type ?? []}
                leadTimeByDesignerPrevious={execKpisPrev?.lead_time_avg_by_designer ?? []}
                trend={execKpis && execKpisPrev && execKpisPrev.globalSLA > 0
                  ? Math.round(((execKpis.globalSLA - execKpisPrev.globalSLA) / execKpisPrev.globalSLA) * 100)
                  : undefined}
                monthNames={monthNames || undefined}
                monthlyComparison={monthlyComparison}
              />
            )}
            {viewMode === 'operacao' && <ManagerReports stats={stats.manager} />}
            {viewMode === 'equipe' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card-enterprise p-6">
                    <span className="text-zinc-400 text-xs font-bold uppercase">SLA Geral</span>
                    <span className="text-3xl font-bold text-white">
                      {execKpis ? execKpis.globalSLA : '...'}%
                    </span>
                  </div>
                </div>
                <DesignerReports stats={stats.designer} showPersonal={profile?.role === 'DESIGNER'} />
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default ReportsPage;
