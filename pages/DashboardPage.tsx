import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Layers,
  AlertTriangle,
  Users,
  Share2,
  FileText,
  Globe,
  Mail,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Minus,
  Inbox
} from "lucide-react";
import Header from "../components/Header";
import { fetchDemands } from "../lib/api";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";
import { Skeleton } from "../components/ui/Skeleton";
import { useAuth } from "../contexts/AuthContext";
import DesignerGoals from "../components/designer/DesignerGoals";
import { getSaoPauloDate, parseDateToSP, isDeliveredStatus, getDeliveryDateStr } from "../lib/timezone";

// Simple empty state component (replaces ReportEmptyState)
const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
      <Inbox size={32} className="text-zinc-600" />
    </div>
    <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
    <p className="text-sm text-zinc-500 max-w-sm">{description}</p>
  </div>
);

const COLORS = [
  "#bcd200",
  "#60a5fa",
  "#fb923c",
  "#71717a",
  "#a855f7",
  "#ec4899",
];

const DashboardPage = () => {
  const { user } = useAuth();
  const [allDemands, setAllDemands] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    workload: 0, // Mock percentage for now or calc based on capacity
    weeklyVolume: [] as any[],
    typeData: [] as any[],
    weeklyTotal: 0,
    lastWeeklyTotal: 0,
    weeklyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedDayDemands, setSelectedDayDemands] = useState<{ date: string; items: any[] } | null>(null);
  const [filterDesigner, setFilterDesigner] = useState<string | null>(null);

  // Determine user role
  const role = user?.role?.toLowerCase() || '';
  const jobTitle = user?.job_title?.toLowerCase() || '';
  const isAdmin = ['admin', 'administrador', 'master'].includes(role);
  const isSocialMedia = jobTitle.includes('social') || role.includes('social');
  const isDesigner = jobTitle.includes('designer') || role.includes('designer');
  const isVideoMaker = jobTitle.includes('video') || role.includes('video') || jobTitle.includes('vídeo');

  // Filter demands based on user role
  const demands = useMemo(() => {
    // Admin and Social Media see all demands
    if (isAdmin || isSocialMedia) return allDemands;

    // Designer/VideoMaker sees only their assigned demands
    if (isDesigner || isVideoMaker) {
      const userId = user?.id;
      const userName = user?.name?.toLowerCase().trim() || '';
      const userEmail = user?.email?.toLowerCase().trim() || '';

      console.log('🔍 Filtering demands for user:', { userId, userName, userEmail, role, jobTitle });

      const filtered = allDemands.filter(d => {
        // Get responsible info from demand
        const responsibleId = d.responsible_id;
        const responsibleProfileId = d.responsible?.id;
        const responsibleName = (d.responsible?.name || '').toLowerCase().trim();
        const responsibleEmail = (d.responsible?.email || '').toLowerCase().trim();

        // Check multiple matching criteria
        const matchById = responsibleId === userId || responsibleProfileId === userId;
        const matchByName = responsibleName && userName && (
          responsibleName === userName ||
          responsibleName.includes(userName) ||
          userName.includes(responsibleName)
        );
        const matchByEmail = responsibleEmail && userEmail && responsibleEmail === userEmail;

        const isMatch = matchById || matchByName || matchByEmail;

        if (isMatch) {
          console.log('✅ Matched demand:', d.title, { responsibleName, matchById, matchByName, matchByEmail });
        }

        return isMatch;
      });

      console.log(`📊 Found ${filtered.length} demands for ${userName}`);
      return filtered;
    }

    // Others see all demands (fallback)
    return allDemands;
  }, [allDemands, isAdmin, isSocialMedia, isDesigner, isVideoMaker, user]);

  const loadData = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const data = await fetchDemands();
    if (data) {
      setAllDemands(data);
    }
    if (!silent) setLoading(false);
  }, []);

  // Recalculate stats when filtered demands change
  useEffect(() => {
    if (demands.length > 0 || !loading) {
      calculateStats(demands);
    }
  }, [demands, loading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtimeSubscription(["demands"], () => loadData(true));

  const calculateStats = (data: any[]) => {
    // 1. Total Active (All demands)
    // User request: "contabilizar todos os status de todas as demandas" for Total, Workload, Type.
    const total = data.length;

    // 2. Urgent (Delay Logic)
    // User request: "atraso só contabiliza se tiver nos status de backlog ou revisao"
    const urgent = data.filter((d) => {
      if (!d.deadline) return false;
      const deadline = parseDateToSP(d.deadline);
      deadline.setHours(23, 59, 59, 999);
      const now = getSaoPauloDate();

      if (now <= deadline) return false;

      const s = d.statuses?.name?.toLowerCase() || '';

      if (s.includes('conclu') || s.includes('entregue') || s.includes('finaliz')) return false;

      const isBacklog = s.includes('backlog') || s.includes('fila') || s.includes('pendente');
      const isRevision = s.includes('revisão') || s.includes('revisao') || s.includes('alteração') || s.includes('alteracao');

      return isBacklog || isRevision;
    }).length;

    // 3. Workload (Completion Rate) - Current Month Only
    // User request: "mostrar somente do mes atual... e uma comparação do proximo mês"
    // User request: "contabiliza como concluido... qualquer status menos Backlog, em produção e Revisão"

    const now = getSaoPauloDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const nextMonthDate = new Date(now);
    nextMonthDate.setMonth(currentMonth + 1);
    const nextMonth = nextMonthDate.getMonth();
    const nextYear = nextMonthDate.getFullYear();

    // Helper to check if "Completed" - Only: Concluído, Postar, Agendado
    const isCompletedStatus = (statusName: string) => {
      const s = statusName?.toLowerCase() || '';
      return (
        s.includes('conclu') ||      // Concluído
        s.includes('agendado') ||    // Agendado
        s.includes('postar')         // Postar
      );
    };

    // Current Month Data (Workload / Productivity)
    // Total Active/Due: Demands with Deadline in Current Month
    const currentMonthDemands = data.filter(d => {
      if (!d.deadline) return false;
      const date = new Date(d.deadline);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Completed: Demands DELIVERED (updated_at) in Current Month
    const currentCompleted = data.filter(d => {
      const s = d.statuses?.name || '';
      if (!isCompletedStatus(s)) return false;
      const dateStr = d.updated_at; // Use Delivery Date
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const currentTotal = currentMonthDemands.length; // Scope for the month
    // Workload: Delivered vs Planned. Can be > 100%
    const workload = currentTotal > 0 ? Math.round((currentCompleted / currentTotal) * 100) : 0;

    // Next Month Data
    const nextMonthDemands = data.filter(d => {
      if (!d.deadline) return false;
      const date = new Date(d.deadline);
      return date.getMonth() === nextMonth && date.getFullYear() === nextYear;
    });
    const nextTotal = nextMonthDemands.length;
    // Next Month Completed (Likely 0, but logic holds)
    const nextCompleted = data.filter(d => {
      const s = d.statuses?.name || '';
      if (!isCompletedStatus(s)) return false;
      const dateStr = d.updated_at;
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date.getMonth() === nextMonth && date.getFullYear() === nextYear;
    }).length;
    const nextWorkload = nextTotal > 0 ? Math.round((nextCompleted / nextTotal) * 100) : 0;

    // 4. Weekly Volume (Current Week: Mon-Sun) - Based on DEADLINE for completed demands
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const weeklyMap = new Array(7).fill(0);
    const lastWeeklyMap = new Array(7).fill(0);

    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);

    const endOfLastWeek = new Date(endOfWeek);
    endOfLastWeek.setDate(endOfWeek.getDate() - 7);

    let lastWeekCount = 0;

    data.forEach((d) => {
      const s = d.statuses?.name?.toLowerCase() || '';
      const isDone = isCompletedStatus(s); // Use helper

      // Usar DATA DE ENTREGA (updated_at para status entregues) em vez de deadline
      const deliveryDateStr = getDeliveryDateStr(d);
      if (!deliveryDateStr) return; // Ignore if no delivery date

      // Parse delivery date correctly (format: YYYY-MM-DD)
      const deliveryDate = new Date(deliveryDateStr + 'T12:00:00');

      // Only count if the demand is COMPLETED and has a delivery date in the target week
      if (isDone) {
        if (deliveryDate >= startOfWeek && deliveryDate <= endOfWeek) {
          const dayIdx = deliveryDate.getDay();
          weeklyMap[dayIdx]++;
        }
        else if (deliveryDate >= startOfLastWeek && deliveryDate <= endOfLastWeek) {
          lastWeekCount++;
          const dayIdx = deliveryDate.getDay();
          lastWeeklyMap[dayIdx]++;
        }
      }
    });

    const weeklyVolume = [
      { name: "Seg", current: weeklyMap[1], previous: lastWeeklyMap[1] },
      { name: "Ter", current: weeklyMap[2], previous: lastWeeklyMap[2] },
      { name: "Qua", current: weeklyMap[3], previous: lastWeeklyMap[3] },
      { name: "Qui", current: weeklyMap[4], previous: lastWeeklyMap[4] },
      { name: "Sex", current: weeklyMap[5], previous: lastWeeklyMap[5] },
      { name: "Sáb", current: weeklyMap[6], previous: lastWeeklyMap[6] },
      { name: "Dom", current: weeklyMap[0], previous: lastWeeklyMap[0] },
    ];

    const weeklyTotal = weeklyMap.reduce((a, b) => a + b, 0);

    let weeklyGrowth = 0;
    if (lastWeekCount > 0) {
      weeklyGrowth = Math.round(((weeklyTotal - lastWeekCount) / lastWeekCount) * 100);
    } else if (weeklyTotal > 0) {
      weeklyGrowth = 100;
    }

    // 5. Demands by Type (All demands)
    const typeCounts: Record<string, number> = {};
    data.forEach((d) => {
      const typeName = d.demand_types?.name || "Outros";
      typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
    });
    const typeData = Object.entries(typeCounts).map(([name, value], idx) => ({
      name,
      value,
      color: COLORS[idx % COLORS.length],
    }));

    setStats({
      total,
      urgent,
      workload,
      nextWorkload,
      weeklyVolume,
      typeData,
      weeklyTotal,
      lastWeeklyTotal: lastWeekCount,
      weeklyGrowth
    });
  };

  const handleBarClick = (data: any, period: 'current' | 'previous') => {
    if (!data || !demands.length) return;

    const dayNameMap: Record<string, number> = {
      "Dom": 0, "Seg": 1, "Ter": 2, "Qua": 3, "Qui": 4, "Sex": 5, "Sáb": 6
    };

    const targetDayIndex = dayNameMap[data.name];
    if (typeof targetDayIndex === 'undefined') return;

    const now = getSaoPauloDate();

    // Re-calculate start of week (same logic as calculateStats)
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    let targetDate = new Date(startOfWeek);

    // If previous week, subtract 7 days
    if (period === 'previous') {
      targetDate.setDate(targetDate.getDate() - 7);
    }

    // Now find the specific day date
    // logic: startOfWeek is Monday (day 1). 
    // If targetDayIndex is 1 (Seg), offset is 0.
    // If targetDayIndex is 2 (Ter), offset is 1.
    // If targetDayIndex is 0 (Dom), offset is 6.

    // Correction: startOfWeek IS Monday (Date object).
    // so we need offset from Monday.
    // Mon(1) -> 0
    // Tue(2) -> 1
    // ...
    // Sun(0) -> 6

    const offset = targetDayIndex === 0 ? 6 : targetDayIndex - 1;
    targetDate.setDate(targetDate.getDate() + offset);

    // Filter demands for this date - usando DATA DE ENTREGA
    const dayItems = demands.filter(d => {
      // Must be completed
      const s = d.statuses?.name || '';
      if (!statsWrapper.isCompletedStatus(s)) return false;

      // Check delivery date match (usando data de entrega)
      const deliveryDateStr = getDeliveryDateStr(d);
      if (!deliveryDateStr) return false;

      const deliveryDate = new Date(deliveryDateStr + 'T12:00:00');
      return deliveryDate.getDate() === targetDate.getDate() &&
        deliveryDate.getMonth() === targetDate.getMonth() &&
        deliveryDate.getFullYear() === targetDate.getFullYear();
    });

    setSelectedDayDemands({
      date: targetDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
      items: dayItems
    });
  };

  // Helper Wrapper to access isCompletedStatus outside calculateStats
  // Only: Concluído, Postar, Agendado
  const statsWrapper = {
    isCompletedStatus: (statusName: string) => {
      const s = statusName?.toLowerCase() || '';
      return (
        s.includes('conclu') ||      // Concluído
        s.includes('agendado') ||    // Agendado
        s.includes('postar')         // Postar
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "concluído":
        return "text-primary bg-primary/10 border-primary/20";
      case "em progresso":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "atrasado":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "revisão":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-zinc-400 bg-zinc-800 border-zinc-700";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-950">
      <Header title="Dashboard" subtitle="Gerenciamento Bet Aki" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 custom-scrollbar">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">

          {/* User-specific view indicator */}
          {!isAdmin && !isSocialMedia && (isDesigner || isVideoMaker) && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <Users size={20} className="text-blue-400" />
              <div>
                <span className="text-blue-400 font-medium">Minha Visão</span>
                <span className="text-zinc-400 text-sm ml-2">
                  Exibindo apenas demandas atribuídas a você ({demands.length} demandas)
                </span>
              </div>
            </div>
          )}

          {/* Designer Goals - Only show for designers/videomakers */}
          {(isDesigner || isVideoMaker) && !loading && (
            <DesignerGoals
              demands={demands}
              userName={user?.name || ''}
              dailyGoal={5}
              weeklyGoal={25}
            />
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              <>
                <div className="card-enterprise card-primary p-6 flex flex-col justify-between gap-4 h-[160px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24 bg-white/10" />
                      <Skeleton className="h-10 w-16 bg-white/10" />
                    </div>
                    <Skeleton className="size-10 rounded-full bg-white/10" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 bg-white/10" />
                    <Skeleton className="h-5 w-24 bg-white/10" />
                  </div>
                </div>
                <div className="card-enterprise card-secondary p-6 flex flex-col justify-between gap-4 h-[160px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24 bg-zinc-800" />
                      <Skeleton className="h-10 w-16 bg-zinc-800" />
                    </div>
                    <Skeleton className="size-10 rounded-full bg-zinc-800" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 bg-zinc-800" />
                    <Skeleton className="h-5 w-24 bg-zinc-800" />
                  </div>
                </div>
                <div className="card-enterprise card-secondary p-6 flex flex-col justify-between gap-4 h-[160px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24 bg-zinc-800" />
                      <Skeleton className="h-10 w-16 bg-zinc-800" />
                    </div>
                    <Skeleton className="size-10 rounded-full bg-zinc-800" />
                  </div>
                  <Skeleton className="h-1.5 w-full bg-zinc-800 rounded-full" />
                </div>
              </>
            ) : (
              <>
                {/* Primary Card: Demandas Totais */}
                <div className="card-enterprise card-primary flex flex-col justify-between gap-4 p-6 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/10"></div>
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-white text-contrast-title text-sm font-medium">
                        Demandas Totais
                      </p>
                      <h3 className="text-white text-4xl font-bold mt-2 text-contrast-value">
                        {stats.total}
                      </h3>
                    </div>
                    <div className="size-10 rounded-full bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-primary">
                      <Layers size={24} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative z-10">
                    <span className="text-primary bg-primary/10 px-2 py-0.5 rounded text-xs font-bold">
                      Atualizado
                    </span>
                    <span className="text-zinc-500 text-contrast-sub text-xs">
                      agora mesmo
                    </span>
                  </div>
                </div>

                {/* Secondary Card: Urgent */}
                <div className="card-enterprise card-secondary flex flex-col justify-between gap-4 p-6 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-orange-500/10"></div>
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-zinc-300 text-contrast-title text-sm font-medium">
                        Ações Urgentes
                      </p>
                      <h3 className="text-orange-400 text-4xl font-bold mt-2 text-contrast-value">
                        {stats.urgent}
                      </h3>
                    </div>
                    <div className="size-10 rounded-full bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-orange-400">
                      <AlertTriangle size={24} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative z-10">
                    <span className="text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded text-xs font-bold">
                      Atenção
                    </span>
                    <span className="text-zinc-500 text-contrast-sub text-xs">
                      requer ação imediata
                    </span>
                  </div>
                </div>

                {/* Secondary Card: Workload */}
                <div className="card-enterprise card-secondary flex flex-col justify-between gap-4 p-6 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/10"></div>
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-zinc-300 text-contrast-title text-sm font-medium">
                        Carga de Trabalho (Mês Atual)
                      </p>
                      <h3 className="text-blue-400 text-4xl font-bold mt-2 text-contrast-value">
                        {stats.workload}%
                      </h3>
                    </div>
                    <div className="size-10 rounded-full bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-blue-400">
                      <Users size={24} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 relative z-10 mt-1">
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full">
                      <div
                        className="bg-blue-400 h-1.5 rounded-full"
                        style={{ width: `${stats.workload}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Próximo Mês: <span className="text-zinc-300">{stats.nextWorkload}%</span>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <div className="lg:col-span-2 card-enterprise p-6 flex flex-col h-[400px]">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48 bg-zinc-800" />
                      <Skeleton className="h-4 w-32 bg-zinc-800" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Skeleton className="h-8 w-24 bg-zinc-800" />
                      <Skeleton className="h-4 w-20 bg-zinc-800" />
                    </div>
                  </div>
                  <div className="flex-1 flex items-end justify-between gap-2 px-4">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                      <div key={i} className="flex gap-1 w-full h-full items-end justify-center">
                        <Skeleton className="w-8 h-[60%] bg-zinc-800 rounded-t" />
                        <Skeleton className="w-8 h-[80%] bg-zinc-800 rounded-t" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-6 h-[400px]">
                  <Skeleton className="h-6 w-40 bg-zinc-800 mb-8" />
                  <div className="flex-1 flex items-center justify-center relative">
                    <Skeleton className="size-48 rounded-full border-8 border-zinc-800 bg-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <Skeleton className="h-8 w-16 bg-zinc-800" />
                      <Skeleton className="h-4 w-10 bg-zinc-800" />
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 mt-6 flex-wrap">
                    {[1, 2, 3].map(i => (
                      <div key={i}>
                        <Skeleton className="h-4 w-16 bg-zinc-800" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="lg:col-span-2 card-enterprise p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-primary text-lg font-bold">
                        Entregas da Semana
                      </h3>
                      <p className="text-zinc-400 text-sm">
                        Demandas Concluídas por Dia
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-2xl font-bold">
                        {stats.weeklyTotal} Entregas
                      </p>
                      <div className={`flex items-center justify-end gap-1 text-xs font-medium ${stats.weeklyGrowth > 0 ? 'text-emerald-500' : stats.weeklyGrowth < 0 ? 'text-red-500' : 'text-zinc-500'
                        }`}>
                        {stats.weeklyGrowth > 0 ? <ArrowUp size={12} /> : stats.weeklyGrowth < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
                        {Math.abs(stats.weeklyGrowth)}% vs semana anterior
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-[300px] min-h-[300px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.weeklyVolume}>
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#71717a", fontSize: 12 }}
                        />
                        <YAxis hide={true} />
                        <Tooltip
                          cursor={{ fill: "transparent" }}
                          contentStyle={{
                            backgroundColor: "#09090b",
                            borderColor: "#27272a",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                          itemStyle={{ color: "#fff" }}
                        />
                        <Bar
                          dataKey="previous"
                          name="Semana Passada"
                          radius={[4, 4, 4, 4]}
                          fill="#d9f99d"
                          cursor="pointer"
                          onClick={(data) => handleBarClick(data, 'previous')}
                        />
                        <Bar
                          dataKey="current"
                          name="Semana Atual"
                          radius={[4, 4, 4, 4]}
                          fill="#bcd200"
                          cursor="pointer"
                          onClick={(data) => handleBarClick(data, 'current')}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
                  <h3 className="text-primary text-lg font-bold mb-4">
                    Demandas por Tipo
                  </h3>
                  <div className="w-full h-[300px] min-h-[300px] relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.typeData}
                          innerRadius={80}
                          outerRadius={100}
                          paddingAngle={0}
                          dataKey="value"
                          stroke="none"
                        >
                          {stats.typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#09090b",
                            borderColor: "#27272a",
                            borderRadius: "8px",
                            color: "#bcd200",
                          }}
                          itemStyle={{ color: "#bcd200" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <span className="text-4xl font-bold text-white">
                          {stats.total}
                        </span>
                        <p className="text-sm text-zinc-500">Total</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 mt-2 flex-wrap">
                    {stats.typeData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: d.color }}
                        ></div>
                        <span className="text-xs text-zinc-400">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recent Demands */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-primary text-xl font-bold tracking-tight">
                Demandas Recentes
              </h3>
              <button className="text-sm text-zinc-400 hover:text-primary transition-colors font-medium">
                Ver Todas
              </button>
            </div>
            <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              {loading ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-auto">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                          <th key={i} className="p-4"><Skeleton className="h-4 w-24 bg-zinc-800" /></th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {[1, 2, 3, 4, 5].map(i => (
                        <tr key={i}>
                          {[1, 2, 3, 4, 5, 6].map(j => (
                            <td key={j} className="p-4"><Skeleton className="h-4 w-full bg-zinc-800" /></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : demands.length === 0 ? (
                <EmptyState
                  title="Sem demandas recentes"
                  description="Não há atividades recentes para exibir no momento."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-auto">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950">
                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-primary">
                          Título
                        </th>
                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-primary">
                          Responsável
                        </th>
                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-primary">
                          Status
                        </th>
                        <th className="p-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-primary">
                          Prazo
                        </th>
                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-primary">
                          Tipo
                        </th>
                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-primary">
                          Origem
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {demands.slice(0, 5).map((demand) => (
                        <tr
                          key={demand.id}
                          className="group hover:bg-zinc-800/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-white font-medium">
                                {demand.title}
                              </span>
                              <span className="text-xs text-zinc-500">
                                #{demand.id.slice(0, 6)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="size-8 rounded-full bg-cover bg-center bg-zinc-700 flex items-center justify-center text-xs font-bold text-white"
                                style={{
                                  backgroundImage: demand.responsible
                                    ?.avatar_url
                                    ? `url("${demand.responsible.avatar_url}")`
                                    : "none",
                                }}
                              >
                                {!demand.responsible?.avatar_url &&
                                  (demand.responsible?.name
                                    ?.slice(0, 2)
                                    .toUpperCase() ||
                                    "NA")}
                              </div>
                              <span className="text-sm text-zinc-200">
                                {demand.responsible?.name || "Não atribuído"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                demand.statuses?.name
                              )}`}
                            >
                              {demand.statuses?.name || "Sem status"}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-white font-medium whitespace-nowrap">
                            {demand.deadline
                              ? new Date(
                                demand.deadline.split("T")[0] + "T12:00:00"
                              ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-zinc-300 text-sm">
                              <Share2 size={16} />
                              {demand.demand_types?.name || "Geral"}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-zinc-400">
                            {demand.origins?.name || "-"}
                          </td>
                        </tr>
                      ))}
                      {demands.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-zinc-500"
                          >
                            Nenhuma demanda recente encontrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Day Details Modal */}
      {/* Day Details Modal */}
      {selectedDayDemands && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <div>
                <h3 className="text-xl font-bold text-white capitalize">{selectedDayDemands.date}</h3>
                <div className="flex items-center gap-3 mt-1.5">
                  {/* Total Count */}
                  <span className="text-zinc-300 text-sm font-medium">{selectedDayDemands.items.length} entregas</span>

                  <span className="text-zinc-700">|</span>

                  {/* Breakdown by Designer */}
                  <div className="flex items-center gap-2">
                    {Object.entries(selectedDayDemands.items.reduce((acc: any, item: any) => {
                      const name = item.responsible?.name?.split(' ')[0] || 'N/A';
                      acc[name] = (acc[name] || 0) + 1;
                      return acc;
                    }, {})).map(([name, count]: any) => (
                      <button
                        key={name}
                        onClick={() => setFilterDesigner(prev => prev === name ? null : name)}
                        className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border transition-colors ${filterDesigner === name
                          ? 'bg-primary/20 text-primary border-primary'
                          : 'text-zinc-400 bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800'
                          }`}
                      >
                        <span>{name}</span>
                        <span className={`font-bold ${filterDesigner === name ? 'text-primary' : 'text-white'}`}>{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setSelectedDayDemands(null); setFilterDesigner(null); }}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {selectedDayDemands.items.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  Nenhuma entrega registrada neste dia.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedDayDemands.items
                    .filter(item => !filterDesigner || (item.responsible?.name?.split(' ')[0] || 'N/A') === filterDesigner)
                    .map(item => (
                      <div key={item.id} className="group flex items-center justify-between p-3 rounded-lg border border-zinc-800/30 hover:border-zinc-700/50 hover:bg-zinc-800/20 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Status Dot */}
                          <div
                            className="shrink-0 size-1.5 rounded-full"
                            style={{ backgroundColor: item.statuses?.color || '#71717a' }}
                          />

                          {/* Title & Code */}
                          <div className="min-w-0 flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-medium truncate max-w-[300px]">{item.title}</span>
                              {/* Code if available, or just ID snippet */}
                              <span className="hidden sm:inline-block text-[10px] text-zinc-600 font-mono">
                                #{item.id.slice(0, 4)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-zinc-500">
                                {item.updated_at ? new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </span>
                              <span
                                className="text-[10px] px-2 py-0.5 rounded font-bold uppercase text-white shadow-sm"
                                style={{
                                  backgroundColor: item.statuses?.color || '#52525b',
                                }}
                              >
                                {item.statuses?.name}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Responsible Avatar (Compact) */}
                        <div className="shrink-0 ml-4 pointer-events-none">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] hidden sm:block ${filterDesigner === (item.responsible?.name?.split(' ')[0] || 'N/A') ? 'text-primary font-bold' : 'text-zinc-500'}`}>
                              {item.responsible?.name?.split(' ')[0]}
                            </span>
                            <div className="size-6 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700/50">
                              {item.responsible?.avatar_url ? (
                                <img src={item.responsible.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-500 font-bold">
                                  {item.responsible?.name?.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* Empty state if filter hides all */}
                  {selectedDayDemands.items.filter(item => !filterDesigner || (item.responsible?.name?.split(' ')[0] || 'N/A') === filterDesigner).length === 0 && (
                    <div className="py-8 text-center text-zinc-500 text-sm">
                      Nenhuma entrega encontrada para <span className="text-white font-bold">{filterDesigner}</span> neste dia.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer / Summary if needed, or simple padding */}
            <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50 text-xs text-center text-zinc-600">
              Mostrando {selectedDayDemands.items.length} itens de {selectedDayDemands.date}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;
