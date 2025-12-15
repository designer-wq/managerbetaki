import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { ChevronDown, Filter, Download } from 'lucide-react';
import { fetchDemands, fetchAllLogs } from '../lib/api';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../contexts/AuthContext';
import DesignerReports from '../components/reports/DesignerReports';
import ManagerReports from '../components/reports/ManagerReports';
import ExecutiveReports from '../components/reports/ExecutiveReports';

type ViewMode = 'designer' | 'manager' | 'executive';

const ReportsPage = () => {
  const { user, profile, isAdmin } = useAuth();
  const [demands, setDemands] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine default view based on role
  // If user is Admin -> Executive
  // If user is Manager -> Manager
  // Else -> Designer
  const [viewMode, setViewMode] = useState<ViewMode>('designer');

  useEffect(() => {
    if (profile) {
      // Default to Team View ('manager') for everyone as requested
      // "permorcane da equipe aparecer para usuarios comum"
      setViewMode('manager');
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

  const handleTabChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-950">
      <Header title="Relatórios & Análises" />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Role Tabs - Only show relevant tabs for higher roles */}
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            {/* Gestão de Time (Team Performance) - Visible to ALL Users as requested */}
            <button
              onClick={() => handleTabChange('manager')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'manager' ? 'bg-[#bcd200] text-zinc-900 shadow-lg' : 'text-zinc-400 hover:text-white'}`}
            >
              Performance da Equipe
            </button>

            {/* Visão Executiva - Visible only for Managers and Admins */}
            {(profile?.role === 'GERENTE' || profile?.role === 'ADMIN' || isAdmin) && (
              <button
                onClick={() => handleTabChange('executive')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'executive' ? 'bg-[#bcd200] text-zinc-900 shadow-lg' : 'text-zinc-400 hover:text-white'}`}
              >
                Visão Executiva
              </button>
            )}
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
            {viewMode === 'designer' && <DesignerReports stats={stats.designer} />}
            {viewMode === 'manager' && <ManagerReports stats={stats.manager} />}
            {viewMode === 'executive' && <ExecutiveReports stats={stats.executive} />}
          </div>
        )}

      </main>
    </div>
  );
};

export default ReportsPage;