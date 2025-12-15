import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Header from '../components/Header';
import { Filter, Download, Plus, Clock, AlertCircle, CheckCircle, MoreVertical, FileDown, Search, Copy, Trash2, Flag, Pencil, ArrowUpRight } from 'lucide-react';
import SlideOver from '../components/ui/SlideOver';
import CreateDemandForm from '../components/demands/CreateDemandForm';
import DemandTimerBadge from '../components/demands/DemandTimerBadge';
import { fetchDemands, deleteRecord, createRecord, fetchTable } from '../lib/api';
import { usePermissions } from '../contexts/PermissionsContext';
import { useToast } from '../components/ui/ToastContext'; // Use toast
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';

const DemandsPage = () => {
   const [isCreateOpen, setIsCreateOpen] = useState(false);
   const [selectedDemand, setSelectedDemand] = useState<any>(null);

   // Menu State
   const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
   const [demandToDelete, setDemandToDelete] = useState<string | null>(null);
   const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);

   const menuRef = useRef<HTMLDivElement>(null);
   const scrollContainerRef = useRef<HTMLDivElement>(null);

   const { can } = usePermissions();
   const { addToast } = useToast();

   // Data State
   const [demands, setDemands] = useState<any[]>([]);
   const [statuses, setStatuses] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   // Filter State
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedStatus, setSelectedStatus] = useState<string>('all');

   const loadDemands = async () => {
      setLoading(true);
      const [demandsData, statusesData] = await Promise.all([
         fetchDemands(),
         fetchTable('statuses')
      ]);
      setDemands(demandsData || []);
      setStatuses(statusesData || []);
      setLoading(false);
   };

   useEffect(() => {
      loadDemands();
   }, []);

   useRealtimeSubscription(['demands'], loadDemands);

   const handleDeleteDemand = async (id: string) => {
      try {
         await deleteRecord('demands', id);
         setDemands(prev => prev.filter(d => d.id !== id));
         addToast('Demanda excluída com sucesso', 'success');
         setActiveMenuId(null);
         setDemandToDelete(null);
      } catch (error) {
         console.error('Error deleting demand:', error);
         addToast('Erro ao excluir demanda', 'error');
      }
   };

   const handleDuplicate = async (demand: any) => {
      try {
         const { id, created_at, ...rest } = demand;
         const newDemand = {
            ...rest,
            title: `${rest.title} (Cópia)`,
            status_id: null, // Reset status or keep? Usually reset to backlog/new. Or keep same.
         };
         // We need to match the createRecord expected input? Or just raw object? api.ts createRecord takes data.
         // However, foreign keys like origin_id might be objects in the fetched data? 
         // fetchDemands returns joined data? Yes.
         // So we need to clean the object.
         // This is complex. For now, let's just alert duplication is tricky without raw data.
         // Actually, let's just re-open the create modal with this data populated!
         setSelectedDemand({ ...demand, id: undefined, title: `${demand.title} (Cópia)` }); // Hack to pre-fill
         setIsCreateOpen(true);
         setActiveMenuId(null);
      } catch (error) {
         console.error('Error duplicating:', error);
      }
   };

   const handleEdit = (demand: any) => {
      setSelectedDemand(demand);
      setIsCreateOpen(true);
   };

   // Close menu on outside click
   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setActiveMenuId(null);
            setDemandToDelete(null);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   // Close menu on scroll
   useEffect(() => {
      const handleScroll = () => {
         if (activeMenuId) {
            setActiveMenuId(null);
            setDemandToDelete(null);
         }
      };
      const container = scrollContainerRef.current;
      if (container) {
         container.addEventListener('scroll', handleScroll);
      }
      return () => {
         if (container) {
            container.removeEventListener('scroll', handleScroll);
         }
      };
   }, [activeMenuId]);

   const handleNewDemand = () => {
      setSelectedDemand(null);
      setIsCreateOpen(true);
   };

   const handleRowClick = (demand: any) => {
      setSelectedDemand(demand);
      setIsCreateOpen(true);
   };



   // --- Stats Calculation ---
   const stats = {
      total: demands.length,
      production: demands.filter(d => d.statuses?.name.toLowerCase().includes('produção')).length,
      review: demands.filter(d => d.statuses?.name.toLowerCase().includes('revisão')).length,
      delayed: demands.filter(d => {
         const isCompleted = d.statuses?.name.toLowerCase().includes('concluído');
         if (isCompleted || !d.deadline) return false;
         return new Date(d.deadline + 'T23:59:59') < new Date();
      }).length
   };

   // --- Filtering ---
   const filteredDemands = demands.filter(d => {
      const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
         d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
         d.responsible?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || d.status_id?.toString() === selectedStatus;

      return matchesSearch && matchesStatus;
   });

   const toggleMenu = (e: React.MouseEvent, item: any) => {
      e.stopPropagation();
      if (activeMenuId === item.id) {
         setActiveMenuId(null);
      } else {
         const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
         // Position menu to the left of the button, slightly up
         setMenuPosition({
            top: rect.bottom + window.scrollY + 5,
            left: rect.right - 192 // 192px is w-48
         });
         setActiveMenuId(item.id);
         setDemandToDelete(null);
      }
   };

   return (
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-950">
         <Header
            title="Demandas"
            subtitle="Manage all marketing requests"
         />

         <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 custom-scrollbar">
            <div className="max-w-7xl mx-auto">

               {/* Action Bar */}
               <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                  <div>
                     <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">Visão Geral de Demandas</h1>
                     <p className="text-zinc-400 mt-2">Gerencie solicitações, acompanhe o progresso e cumpra prazos.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                     <button
                        onClick={handleNewDemand}
                        className="flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-black hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5"
                     >
                        <Plus size={18} />
                        <span>Nova Demanda</span>
                     </button>
                  </div>
               </div>


               {/* Quick Stats */}
               <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="card-enterprise card-primary relative overflow-hidden p-5 group hover:border-zinc-500/50 transition-colors">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-contrast-title text-sm font-medium text-zinc-400">Total</p>
                           <p className="mt-1 text-3xl font-bold text-white text-contrast-value">{stats.total}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/50 text-white border border-zinc-700/50">
                           <FileDown size={20} />
                        </div>
                     </div>
                  </div>
                  <div className="card-enterprise card-secondary relative overflow-hidden p-5 group hover:border-zinc-500/50 transition-colors">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-contrast-title text-sm font-medium text-zinc-400">Em Produção</p>
                           <p className="mt-1 text-3xl font-bold text-white text-contrast-value">{stats.production}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/50 text-primary border border-zinc-700/50">
                           <Clock size={20} className="animate-pulse" />
                        </div>
                     </div>
                  </div>
                  <div className="card-enterprise card-secondary relative overflow-hidden p-5 group hover:border-zinc-500/50 transition-colors">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-contrast-title text-sm font-medium text-zinc-400">Revisão</p>
                           <p className="mt-1 text-3xl font-bold text-white text-contrast-value">{stats.review}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/50 text-yellow-500 border border-zinc-700/50">
                           <AlertCircle size={20} />
                        </div>
                     </div>
                  </div>
                  <div className="card-enterprise card-secondary relative overflow-hidden p-5 group hover:border-zinc-500/50 transition-colors">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-contrast-title text-sm font-medium text-zinc-400">Atrasados</p>
                           <p className="mt-1 text-3xl font-bold text-white text-contrast-value">{stats.delayed}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/50 text-red-500 border border-zinc-700/50">
                           <AlertCircle size={20} />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Filters */}
               <div className="mb-6 flex flex-col md:flex-row gap-4">
                  <div className="flex w-full md:w-auto flex-1 items-center bg-zinc-900/50 px-4 py-3 border border-zinc-700/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all rounded-[6px]">
                     <Search size={20} className="text-zinc-500" />
                     <input
                        className="ml-3 w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                        placeholder="Buscar por título, ID ou designer..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>

                  {/* Status Filter */}
                  <div className="w-full md:w-64">
                     <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                        <select
                           value={selectedStatus}
                           onChange={(e) => setSelectedStatus(e.target.value)}
                           className="w-full appearance-none bg-zinc-900/50 border border-zinc-700/50 rounded-[6px] py-3 pl-10 pr-8 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                        >
                           <option value="all">Todos os Status</option>
                           {statuses.map(status => (
                              <option key={status.id} value={status.id}>
                                 {status.name}
                              </option>
                           ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                           <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                           </svg>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Table */}
               <div className="card-enterprise w-full overflow-hidden relative min-h-[400px] border border-zinc-800">
                  {loading && <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 z-10"><span className="text-white">Carregando...</span></div>}

                  <div className="w-full overflow-x-auto custom-scrollbar">
                     <table className="w-full min-w-[1000px] table-auto border-collapse text-left text-sm table-zebra table-hover">
                        <thead>
                           <tr className="border-b border-zinc-800 bg-zinc-900/50 text-contrast-sub">
                              <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">Título do Projeto</th>
                              <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">Prioridade</th>
                              <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">Atribuído a</th>
                              <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">Status</th>
                              <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">Tempo</th>
                              <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">Prazo</th>
                              <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">Tipo</th>
                              <th className="px-6 py-4 text-right font-medium text-zinc-400 text-xs uppercase tracking-wider">Ação</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                           {filteredDemands.length === 0 && !loading && (
                              <tr>
                                 <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                                    Nenhuma demanda encontrada.
                                 </td>
                              </tr>
                           )}
                           {filteredDemands.map((item) => (
                              <tr
                                 key={item.id}
                                 onClick={() => handleRowClick(item)}
                                 className="group transition-colors relative cursor-pointer hover:bg-zinc-800/30"
                              >
                                 <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                       <span className="table-content-title font-display font-medium text-white">{item.title}</span>
                                       <span className="table-content-id font-mono text-zinc-500 text-xs">#{item.id.slice(0, 8)}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    {(() => {
                                       const p = item.priority || 'Média';
                                       // Strict Priority: Icon only or Icon + Text, NO Pill background
                                       const colorClass = p === 'Alta' ? 'text-red-400' :
                                          p === 'Baixa' ? 'text-blue-400' :
                                             'text-yellow-400';
                                       const Icon = p === 'Alta' ? Flag : p === 'Baixa' ? Flag : Flag; // Could assume different icons if available

                                       return (
                                          <div className={`flex items-center gap-2 ${colorClass}`}>
                                             <Icon size={14} fill="currentColor" className="opacity-80" />
                                             <span className="text-xs font-semibold">{p}</span>
                                          </div>
                                       );
                                    })()}
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                       <div className="h-7 w-7 overflow-hidden rounded-full bg-zinc-800 border border-zinc-700 shrink-0">
                                          {item.responsible?.avatar_url ? (
                                             <img src={item.responsible.avatar_url} alt={item.responsible.name} className="h-full w-full object-cover" />
                                          ) : (
                                             <div className="h-full w-full flex items-center justify-center text-[10px] text-zinc-400 uppercase font-bold">{item.responsible?.name?.slice(0, 2) || '?'}</div>
                                          )}
                                       </div>
                                       <span className="text-sm font-medium text-zinc-300 truncate max-w-[120px]">{item.responsible?.name || 'Não atribuído'}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    {/* Status: Strict Pill */}
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ring-1 ring-inset ${item.statuses?.color ? 'text-white' : 'text-zinc-400'} ${item.statuses?.color || 'bg-zinc-800 ring-zinc-700'}`}>
                                       {item.statuses?.name || 'Indefinido'}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <DemandTimerBadge
                                       statusName={item.statuses?.name}
                                       productionStartedAt={item.production_started_at}
                                       accumulatedTime={item.accumulated_time}
                                    />
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex flex-col gap-0.5">
                                       <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                                          {item.deadline ? new Date(item.deadline + 'T12:00:00').toLocaleDateString() : '-'}
                                       </div>
                                       {(() => {
                                          if (!item.deadline) return null;
                                          const deadline = new Date(item.deadline + 'T12:00:00');
                                          const now = new Date();
                                          deadline.setHours(0, 0, 0, 0);
                                          now.setHours(0, 0, 0, 0);

                                          const diffTime = deadline.getTime() - now.getTime();
                                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                          const isCompleted = ['concluído', 'entregue', 'finalizado'].includes(item.statuses?.name?.toLowerCase());

                                          if (isCompleted) return null;

                                          if (diffDays < 0) {
                                             return <span className="text-[10px] text-red-500 font-bold uppercase tracking-wide flex items-center gap-1">Atrasado ({Math.abs(diffDays)}d)</span>;
                                          } else if (diffDays <= 2) {
                                             return <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wide">Próximo ({diffDays === 0 ? 'Hoje' : diffDays + 'd'})</span>;
                                          } else {
                                             return <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">No Prazo</span>;
                                          }
                                       })()}
                                    </div>
                                 </td>

                                 <td className="px-6 py-4">
                                    <span className="text-zinc-400 text-sm">{item.demand_types?.name || 'N/A'}</span>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end">
                                       <button
                                          onClick={(e) => toggleMenu(e, item)}
                                          className="h-8 w-8 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-zinc-700"
                                       >
                                          <MoreVertical size={16} />
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         </div >

         {/* Portal for Actions Menu */}
         {activeMenuId && menuPosition && document.body && createPortal(
            <div
               ref={menuRef}
               style={{
                  position: 'fixed',
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                  zIndex: 9999
               }}
               className="w-48 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
               onClick={(e) => e.stopPropagation()}
            >
               {demandToDelete === activeMenuId ? (
                  <div className="p-4">
                     <p className="text-sm text-zinc-300">
                        Excluir permanentemente?
                     </p>
                     <div className="flex justify-end gap-2 mt-4">
                        <button
                           onClick={() => setActiveMenuId(null)}
                           className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                        >
                           Cancelar
                        </button>
                        {can('demands', 'delete') && (
                           <button
                              onClick={() => handleDeleteDemand(activeMenuId)}
                              className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                           >
                              <Trash2 size={12} />
                              Excluir
                           </button>
                        )}
                     </div>
                  </div>
               ) : (
                  <div className="py-1">
                     {can('demands', 'edit') && (
                        <>
                           <button
                              onClick={() => {
                                 const demand = demands.find(d => d.id === activeMenuId);
                                 if (demand) handleDuplicate(demand);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
                           >
                              <Copy size={14} />
                              Duplicar
                           </button>
                           <button
                              onClick={() => {
                                 const demand = demands.find(d => d.id === activeMenuId);
                                 if (demand) {
                                    handleEdit(demand);
                                    setActiveMenuId(null);
                                 }
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
                           >
                              <Pencil size={14} />
                              Editar
                           </button>
                        </>
                     )}
                     {can('demands', 'delete') && (
                        <button
                           onClick={(e) => {
                              e.stopPropagation();
                              setDemandToDelete(activeMenuId);
                           }}
                           className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                        >
                           <Trash2 size={14} />
                           Excluir
                        </button>
                     )}
                  </div>
               )}
            </div>,
            document.body
         )}




         <SlideOver
            isOpen={isCreateOpen}
            onClose={() => {
               setIsCreateOpen(false);
               setSelectedDemand(null);
            }}
            title={selectedDemand?.id ? "Editar Demanda" : "Nova Demanda"}
         >
            <CreateDemandForm
               onCancel={() => {
                  setIsCreateOpen(false);
                  setSelectedDemand(null);
               }}
               onSuccess={() => {
                  setIsCreateOpen(false);
                  setSelectedDemand(null);
                  loadDemands();
               }}
               initialData={selectedDemand?.id ? selectedDemand : (selectedDemand ? selectedDemand : null)}
            />
         </SlideOver>

      </div >
   );
};

export default DemandsPage;
