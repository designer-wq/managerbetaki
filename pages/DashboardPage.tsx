import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import Header from "../components/Header";
import { fetchDemands } from "../lib/api";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";

const COLORS = [
  "#bcd200",
  "#60a5fa",
  "#fb923c",
  "#71717a",
  "#a855f7",
  "#ec4899",
];

const DashboardPage = () => {
  const [demands, setDemands] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    workload: 0, // Mock percentage for now or calc based on capacity
    weeklyVolume: [] as any[],
    typeData: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  const loadData = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const data = await fetchDemands();
    if (data) {
      setDemands(data);
      calculateStats(data);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtimeSubscription(["demands"], () => loadData(true));

  const calculateStats = (data: any[]) => {
    // 1. Total Active (assuming all fetched are active for now, or filter by status)
    // Let's assume 'Concluído' or 'Arrquivado' is not "Active".
    // Need to check status names. For now, total count.
    const total = data.length;

    // 2. Urgent (Status name contains 'Urgente' or 'Atrasado' or high priority)
    // Since we don't have a priority field, let's use Status names 'Atrasado' or 'Urgente' if they exist.
    // Or just random for demo if we can't determine.
    // Let's filter by status.name.
    const urgent = data.filter((d) =>
      ["Atrasado", "Urgente", "Crítico"].includes(d.statuses?.name)
    ).length;

    // 3. Workload (Completion Rate)
    // Logic: (Completed / Total) * 100
    const completedCount = data.filter((d) =>
      ["concluído", "concluido"].includes(d.statuses?.name?.toLowerCase())
    ).length;

    const workload =
      data.length > 0 ? Math.round((completedCount / data.length) * 100) : 0;

    // 4. Weekly Volume (Mon-Sun)
    // Group by day of week
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const weeklyMap = new Array(7).fill(0);

    data.forEach((d) => {
      const date = new Date(d.created_at);
      // data from last 7 days? Or all time grouped by day?
      // Dashboard usually shows "Current Week".
      // Let's map strict day index.
      const dayIdx = date.getDay(); // 0 = Sun
      weeklyMap[dayIdx]++;
    });
    // Rotate to start on Seg (Array index 1)
    // 0:Seg, 1:Ter...
    const weeklyVolume = [
      { name: "Seg", value: weeklyMap[1] },
      { name: "Ter", value: weeklyMap[2] },
      { name: "Qua", value: weeklyMap[3] },
      { name: "Qui", value: weeklyMap[4] },
      { name: "Sex", value: weeklyMap[5] },
      { name: "Sáb", value: weeklyMap[6] },
      { name: "Dom", value: weeklyMap[0] },
    ];

    // 5. Demands by Type
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

    setStats({ total, urgent, workload, weeklyVolume, typeData });
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    Carga de Trabalho
                  </p>
                  <h3 className="text-blue-400 text-4xl font-bold mt-2 text-contrast-value">
                    {stats.workload}%
                  </h3>
                </div>
                <div className="size-10 rounded-full bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-blue-400">
                  <Users size={24} />
                </div>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-1 relative z-10">
                <div
                  className="bg-blue-400 h-1.5 rounded-full"
                  style={{ width: `${stats.workload}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-enterprise p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-primary text-lg font-bold">
                    Volume Semanal
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Distribuição por Dia da Semana
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white text-2xl font-bold">
                    {stats.total} Solicitações
                  </p>
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
                        color: "#bcd200",
                      }}
                      itemStyle={{ color: "#bcd200" }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 4, 4]} fill="#27272a">
                      {stats.weeklyVolume.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.value > 0 ? "#bcd200" : "#27272a"}
                        />
                      ))}
                    </Bar>
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
                <div className="p-8 text-center text-zinc-500">
                  Carregando...
                </div>
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
    </div>
  );
};

export default DashboardPage;
