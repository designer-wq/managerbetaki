import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Header from '../components/Header';
import { Filter, Download, Plus, Clock, AlertCircle, CheckCircle, MoreVertical, FileDown, Search, Copy, Trash2, Flag, Pencil, ArrowUpRight, Users, Calendar, ChevronDown, ArrowUpDown, Bell, X } from 'lucide-react';
import SlideOver from '../components/ui/SlideOver';
import CreateDemandForm from '../components/demands/CreateDemandForm';
import DemandTimerBadge from '../components/demands/DemandTimerBadge';
// import BulkActionsBar from '../components/demands/BulkActionsBar'; // TEMPORARILY DISABLED
import Pagination from '../components/ui/Pagination';
import { fetchDemands, deleteRecord, fetchTable, fetchProfiles, fetchAuthUsersList, updateRecord } from '../lib/api';
import { usePermissions } from '../contexts/PermissionsContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/ToastContext'; // Use toast
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { usePagination } from '../hooks/usePagination';
// import { useBulkSelection } from '../hooks/useBulkSelection'; // TEMPORARILY DISABLED



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
   const { user } = useAuth();
   const { addToast } = useToast();

   // User role detection
   const role = user?.role?.toLowerCase() || '';
   const jobTitle = user?.job_title?.toLowerCase() || '';
   const isAdmin = ['admin', 'administrador', 'master'].includes(role);
   const isSocialMedia = jobTitle.includes('social') || role.includes('social');
   const isDesigner = jobTitle.includes('designer') || role.includes('designer');
   const isVideoMaker = jobTitle.includes('video') || role.includes('video') || jobTitle.includes('vídeo');
   const canViewAllDemands = isAdmin || isSocialMedia;

   // Data State
   const [allDemands, setAllDemands] = useState<any[]>([]);
   const [designers, setDesigners] = useState<any[]>([]);
   const [statuses, setStatuses] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [bulkLoading, setBulkLoading] = useState(false);

   // Filtered demands based on user role
   const demands = useMemo(() => {
      if (canViewAllDemands) return allDemands;

      // Designer/VideoMaker sees only their assigned demands
      if (isDesigner || isVideoMaker) {
         const userId = user?.id;
         const userName = user?.name?.toLowerCase().trim() || '';
         const userEmail = user?.email?.toLowerCase().trim() || '';

         return allDemands.filter(d => {
            const responsibleId = d.responsible_id;
            const responsibleProfileId = d.responsible?.id;
            const responsibleName = (d.responsible?.name || '').toLowerCase().trim();
            const responsibleEmail = (d.responsible?.email || '').toLowerCase().trim();

            const matchById = responsibleId === userId || responsibleProfileId === userId;
            const matchByName = responsibleName && userName && (
               responsibleName === userName ||
               responsibleName.includes(userName) ||
               userName.includes(responsibleName)
            );
            const matchByEmail = responsibleEmail && userEmail && responsibleEmail === userEmail;

            return matchById || matchByName || matchByEmail;
         });
      }

      return allDemands;
   }, [allDemands, canViewAllDemands, isDesigner, isVideoMaker, user]);

   // Tab State
   const [activeTab, setActiveTab] = useState('backlog');

   // Filter State
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedDesigner, setSelectedDesigner] = useState<string>('all');
   const [dateFilter, setDateFilter] = useState<{ type: 'all' | 'this_week' | 'next_week' | 'custom', startDate: string | null, endDate: string | null }>({ type: 'all', startDate: null, endDate: null });
   const [showDateMenu, setShowDateMenu] = useState(false);
   const [customDateStart, setCustomDateStart] = useState('');
   const [customDateEnd, setCustomDateEnd] = useState('');
   const [sortConfig, setSortConfig] = useState<{ key: string | null, direction: 'asc' | 'desc' | null }>({ key: null, direction: null });

   // Pagination
   const pagination = usePagination({ initialPageSize: 10 });

   // Bulk Selection - TEMPORARILY DISABLED TO FIX INFINITE LOOP
   // const bulkSelection = useBulkSelection({
   //    items: demands,
   //    getItemId: (d: any) => d.id
   // });


   const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' | null = 'asc';
      if (sortConfig.key === key) {
         if (sortConfig.direction === 'asc') direction = 'desc';
         else if (sortConfig.direction === 'desc') direction = null;
      }
      setSortConfig({ key: direction ? key : null, direction });
   };

   const handleDateFilterChange = (type: 'all' | 'this_week' | 'next_week' | 'custom') => {
      if (type === 'all') {
         setDateFilter({ type: 'all', startDate: null, endDate: null });
         setShowDateMenu(false);
      } else if (type === 'this_week') {
         const now = new Date();
         const day = now.getDay();
         const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
         const monday = new Date(now);
         monday.setDate(diff);
         monday.setHours(0, 0, 0, 0);
         const sunday = new Date(monday);
         sunday.setDate(monday.getDate() + 6);
         sunday.setHours(23, 59, 59, 999);

         setDateFilter({
            type: 'this_week',
            startDate: monday.toISOString().split('T')[0],
            endDate: sunday.toISOString().split('T')[0]
         });
         setShowDateMenu(false);
      } else if (type === 'next_week') {
         const now = new Date();
         const day = now.getDay();
         const diff = now.getDate() - day + (day === 0 ? -6 : 1);
         const nextMonday = new Date(now);
         nextMonday.setDate(diff + 7);
         nextMonday.setHours(0, 0, 0, 0);
         const nextSunday = new Date(nextMonday);
         nextSunday.setDate(nextMonday.getDate() + 6);
         nextSunday.setHours(23, 59, 59, 999);

         setDateFilter({
            type: 'next_week',
            startDate: nextMonday.toISOString().split('T')[0],
            endDate: nextSunday.toISOString().split('T')[0]
         });
         setShowDateMenu(false);
      } else {
         setDateFilter({ ...dateFilter, type: 'custom' });
         // Don't close menu, show custom inputs
      }
   };

   const applyCustomDateFilter = () => {
      if (customDateStart && customDateEnd) {
         setDateFilter({
            type: 'custom',
            startDate: customDateStart,
            endDate: customDateEnd
         });
         setShowDateMenu(false);
      }
   };

   const loadDemands = React.useCallback(async (silent = false) => {
      if (!silent) setLoading(true);
      const [demandsData, profilesData, statusesData] = await Promise.all([
         fetchDemands(),
         fetchProfiles(),
         fetchTable('statuses')
      ]);

      setAllDemands(demandsData || []);
      setStatuses(statusesData || []);

      // Filter only Designers using Auth Users (same as CreateDemandForm)
      let onlyDesigners: any[] = [];
      try {
         const authUsers = await fetchAuthUsersList();
         if (authUsers) {
            onlyDesigners = authUsers.filter((u: any) => {
               if (u.status !== 'active' || !u.job_title_name) return false;
               const jobTitle = u.job_title_name.toLowerCase();
               return jobTitle.includes('designer') || jobTitle.includes('video maker') || jobTitle.includes('videomaker');
            });
         }
      } catch (err) {
         console.error("Error fetching designers:", err);
         // Fallback to profiles if RPC fails
         onlyDesigners = (profilesData || []).filter((p: any) => {
            const jobTitle = (p.job_title || p.job_title_name || '').toLowerCase();
            return jobTitle.includes('designer') ||
               jobTitle.includes('video maker') ||
               jobTitle.includes('videomaker') ||
               p.role === 'DESIGNER';
         });
      }
      setDesigners(onlyDesigners);

      if (!silent) setLoading(false);
   }, []);

   useEffect(() => {
      loadDemands();
   }, [loadDemands]);

   useRealtimeSubscription(['demands'], () => loadDemands(true));

   // Bulk Actions Handlers - TEMPORARILY DISABLED
   // const handleBulkStatusChange = async (statusId: string) => {
   //    const selectedIds = Array.from(bulkSelection.selectedIds);
   //    if (selectedIds.length === 0) {
   //       addToast('Selecione pelo menos uma demanda', 'error');
   //       return;
   //    }
   //
   //    setBulkLoading(true);
   //    try {
   //       console.log('Changing status for:', selectedIds, 'to:', statusId);
   //       for (const id of selectedIds) {
   //          await updateRecord('demands', id, { status_id: statusId });
   //       }
   //       addToast(`Status alterado para ${selectedIds.length} demanda(s)`, 'success');
   //       bulkSelection.clearSelection();
   //       await loadDemands(true);
   //    } catch (error) {
   //       console.error('Bulk status change error:', error);
   //       addToast('Erro ao alterar status em lote', 'error');
   //    } finally {
   //       setBulkLoading(false);
   //    }
   // };
   //
   // const handleBulkAssignDesigner = async (designerId: string) => {
   //    const selectedIds = Array.from(bulkSelection.selectedIds);
   //    if (selectedIds.length === 0) {
   //       addToast('Selecione pelo menos uma demanda', 'error');
   //       return;
   //    }
   //
   //    setBulkLoading(true);
   //    try {
   //       console.log('Assigning designer:', designerId, 'to:', selectedIds);
   //       for (const id of selectedIds) {
   //          await updateRecord('demands', id, { responsible_id: designerId || null });
   //       }
   //       addToast(`Designer ${designerId ? 'atribuído' : 'removido'} de ${selectedIds.length} demanda(s)`, 'success');
   //       bulkSelection.clearSelection();
   //       await loadDemands(true);
   //    } catch (error) {
   //       console.error('Bulk assign error:', error);
   //       addToast('Erro ao atribuir designer em lote', 'error');
   //    } finally {
   //       setBulkLoading(false);
   //    }
   // };
   //
   // const handleBulkDelete = async () => {
   //    const selectedIds = Array.from(bulkSelection.selectedIds);
   //    if (selectedIds.length === 0) {
   //       addToast('Selecione pelo menos uma demanda', 'error');
   //       return;
   //    }
   //
   //    setBulkLoading(true);
   //    try {
   //       console.log('Deleting:', selectedIds);
   //       for (const id of selectedIds) {
   //          await deleteRecord('demands', id);
   //       }
   //       addToast(`${selectedIds.length} demanda(s) excluída(s)`, 'success');
   //       bulkSelection.clearSelection();
   //       await loadDemands(true);
   //    } catch (error) {
   //       console.error('Bulk delete error:', error);
   //       addToast('Erro ao excluir em lote', 'error');
   //    } finally {
   //       setBulkLoading(false);
   //    }
   // };

   const handleDeleteDemand = async (id: string) => {
      try {
         await deleteRecord('demands', id);
         setAllDemands(prev => prev.filter(d => d.id !== id));
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



   // Helper for Delayed Logic
   const isDelayed = (d: any) => {
      const s = d.statuses?.name?.toLowerCase() || '';
      const isCompleted = s.includes('conclu') || s.includes('agendado') || s.includes('postar');
      if (isCompleted || !d.deadline) return false;
      return new Date(d.deadline.split('T')[0] + 'T23:59:59') < new Date();
   };

   // --- ID Generation ---
   const demandIdMap = useMemo(() => {
      const map = new Map<string, string>();
      // Sort by created_at ascending to determine sequence
      const sorted = [...demands].sort((a, b) => {
         const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
         const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
         return timeA - timeB;
      });

      const counters: Record<string, number> = {};

      sorted.forEach(d => {
         if (!d.created_at) return;
         const date = new Date(d.created_at);
         const year = date.getFullYear();
         const monthIndex = date.getMonth(); // 0-11
         const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
         const month = months[monthIndex];
         const key = `${year}_${month}`;

         if (!counters[key]) counters[key] = 0;
         counters[key]++;

         const sequence = String(counters[key]); // .padStart(2, '0') removed? user showed "0...." maybe just 01?
         // User example: 2025_DEZ_01, 2025_DEZ_02. So padStart(2, '0') is appropriate.
         map.set(d.id, `${key}_${sequence.padStart(2, '0')}`);
      });

      return map;
   }, [demands]);

   // --- Stats Calculation - Must match tab filter logic ---
   const stats = useMemo(() => {
      // Production: same as tab 'production'
      const production = demands.filter(d => {
         const statusName = d.statuses?.name?.toLowerCase() || '';
         return statusName.includes('produção') || statusName.includes('producao');
      }).length;

      // Review/Stalled: same as tab 'stalled' - Revisão + Ag. ODDs + Parado
      const review = demands.filter(d => {
         const statusName = (d.statuses?.name || '').toLowerCase().trim();
         return statusName.includes('revisão') ||
            statusName.includes('revisao') ||
            statusName.includes('ag. odds') ||
            statusName.includes('ag.odds') ||
            statusName.includes('odds') ||
            statusName.includes('parado') ||
            statusName.includes('aguardando');
      }).length;

      // Delayed: same as isDelayed function
      const delayed = demands.filter(isDelayed).length;

      return {
         total: demands.length,
         production,
         review,
         delayed
      };
   }, [demands]);

   // --- Demandas prestes a vencer (2 dias) ---
   const [showExpirationAlert, setShowExpirationAlert] = useState(true);
   const demandsAboutToExpire = useMemo(() => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      return demands.filter(d => {
         if (!d.deadline) return false;

         // Check if already completed
         const s = d.statuses?.name?.toLowerCase() || '';
         const isCompleted = s.includes('conclu') || s.includes('agendado') || s.includes('postar') || s.includes('entregue');
         if (isCompleted) return false;

         const deadline = new Date(d.deadline.split('T')[0] + 'T12:00:00');
         deadline.setHours(0, 0, 0, 0);

         const diffTime = deadline.getTime() - now.getTime();
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

         // Between 0 and 2 days (inclusive)
         return diffDays >= 0 && diffDays <= 2;
      });
   }, [demands]);

   // --- Filtering ---
   const filteredDemands = demands.filter(d => {
      const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
         d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
         demandIdMap.get(d.id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         d.responsible?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDesigner = selectedDesigner === 'all' || d.responsible_id === selectedDesigner;

      // Tab Check
      const statusName = d.statuses?.name?.toLowerCase() || '';
      let matchesTab = false;

      // Tab Rules
      // Backlog: only 'backlog'
      // Aprovar: 'postar', 'ap', 'gerente', 'agendado'
      // Produção: 'produção'
      // Parado: 'revisao', 'ag. odds'
      // Concluídos: 'concluídos'

      if (activeTab === 'backlog') {
         matchesTab = statusName.includes('backlog');
      } else if (activeTab === 'approval') {
         matchesTab = ['postar', 'ap', 'gerente', 'agendado'].some(k => statusName.includes(k));
      } else if (activeTab === 'production') {
         matchesTab = statusName.includes('produção') || statusName.includes('producao');
      } else if (activeTab === 'stalled') {
         matchesTab = statusName.includes('revisão') ||
            statusName.includes('revisao') ||
            statusName.includes('ag. odds') ||
            statusName.includes('ag.odds') ||
            statusName.includes('odds') ||
            statusName.includes('parado') ||
            statusName.includes('aguardando');
      } else if (activeTab === 'completed') {
         matchesTab = statusName.includes('concluído') || statusName.includes('concluido') || statusName.includes('entregue') || statusName.includes('finalizado');
      } else if (activeTab === 'delayed') {
         matchesTab = isDelayed(d);
      } else {
         matchesTab = true;
      }

      let matchesDate = true;
      if (dateFilter.type !== 'all') {
         if (!d.deadline) {
            matchesDate = false;
         } else {
            // Normalize both dates to YYYY-MM-DD strings for comparison
            // This avoids timezone offset issues
            const deadlineParts = d.deadline.split('T')[0].split('-');
            const deadlineNormalized = new Date(
               parseInt(deadlineParts[0]),
               parseInt(deadlineParts[1]) - 1,
               parseInt(deadlineParts[2]),
               12, 0, 0 // Use noon to avoid timezone edge cases
            );

            if (dateFilter.startDate && dateFilter.endDate) {
               const startParts = dateFilter.startDate.split('-');
               const endParts = dateFilter.endDate.split('-');

               const startNormalized = new Date(
                  parseInt(startParts[0]),
                  parseInt(startParts[1]) - 1,
                  parseInt(startParts[2]),
                  0, 0, 0
               );

               const endNormalized = new Date(
                  parseInt(endParts[0]),
                  parseInt(endParts[1]) - 1,
                  parseInt(endParts[2]),
                  23, 59, 59
               );

               matchesDate = deadlineNormalized >= startNormalized && deadlineNormalized <= endNormalized;
            }
         }
      }

      return matchesSearch && matchesDesigner && matchesDate && matchesTab;
   });

   const sortedDemands = [...filteredDemands].sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) {
         // Default Sort Logic based on Tab

         // User Request: "nas abas de aprovar e concluidos.. deve aparecer o mais recente criado [alterado]"
         if (activeTab === 'approval' || activeTab === 'completed') {
            const dateA = a.updated_at ? new Date(a.updated_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
            const dateB = b.updated_at ? new Date(b.updated_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
            return dateB - dateA; // Most recent update first
         }

         // Default: Recent (created_at desc)
         const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
         const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
         return dateB - dateA;
      }

      const { key, direction } = sortConfig;
      const modifier = direction === 'asc' ? 1 : -1;

      if (key === 'title') {
         return modifier * (a.title || '').localeCompare(b.title || '');
      }
      if (key === 'deadline') {
         if (!a.deadline) return 1;
         if (!b.deadline) return -1;
         return modifier * (new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      }
      if (key === 'time') {
         // Calculate total time in seconds for each demand
         const getTimeValue = (d: any) => {
            let total = d.accumulated_time || 0;
            if (d.production_started_at) {
               const statusName = d.statuses?.name?.toLowerCase() || '';
               const isInProduction = statusName.includes('produção') || statusName.includes('producao');
               if (isInProduction) {
                  const elapsed = Math.floor((Date.now() - new Date(d.production_started_at).getTime()) / 1000);
                  total += elapsed;
               }
            }
            return total;
         };

         const timeA = getTimeValue(a);
         const timeB = getTimeValue(b);

         // When ascending: items without time first, then by time ascending
         // When descending: items with time first (highest), then items without time
         if (direction === 'asc') {
            if (timeA === 0 && timeB === 0) return 0;
            if (timeA === 0) return -1;
            if (timeB === 0) return 1;
            return timeA - timeB;
         } else {
            if (timeA === 0 && timeB === 0) return 0;
            if (timeA === 0) return 1;
            if (timeB === 0) return -1;
            return timeB - timeA;
         }
      }
      return 0;
   });

   // Update pagination total when filtered results change
   useEffect(() => {
      pagination.setTotalItems(sortedDemands.length);
      // Reset to page 1 when filters change
      if (pagination.page > 1 && sortedDemands.length <= (pagination.page - 1) * pagination.pageSize) {
         pagination.setPage(1);
      }
   }, [sortedDemands.length, activeTab, searchTerm, selectedDesigner, dateFilter, pagination.setTotalItems, pagination.setPage, pagination.page, pagination.pageSize]);

   // Get paginated slice of sorted demands - memoize to prevent infinite loops
   const paginatedDemands = useMemo(() => sortedDemands.slice(
      pagination.startIndex,
      pagination.startIndex + pagination.pageSize
   ), [sortedDemands, pagination.startIndex, pagination.pageSize]);

   // Update visible items for bulk selection - DISABLED
   // useEffect(() => {
   //    bulkSelection.setVisibleItems(paginatedDemands);
   // }, [paginatedDemands, bulkSelection.setVisibleItems]);

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

               {/* User-specific view indicator */}
               {!canViewAllDemands && (isDesigner || isVideoMaker) && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
                     <Users size={20} className="text-blue-400" />
                     <div>
                        <span className="text-blue-400 font-medium">Minhas Demandas</span>
                        <span className="text-zinc-400 text-sm ml-2">
                           Exibindo apenas demandas atribuídas a você ({demands.length} demandas)
                        </span>
                     </div>
                  </div>
               )}

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

               {/* Alerta de Demandas Prestes a Vencer */}
               {showExpirationAlert && demandsAboutToExpire.length > 0 && (
                  <div className="mb-6 relative">
                     <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 animate-pulse-subtle">
                        <div className="flex items-start gap-3">
                           <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                 <Bell size={20} className="text-amber-400 animate-bounce" />
                              </div>
                           </div>
                           <div className="flex-1 min-w-0">
                              <h3 className="text-amber-400 font-bold text-sm flex items-center gap-2">
                                 <span>⚠️ Atenção: {demandsAboutToExpire.length} demanda{demandsAboutToExpire.length > 1 ? 's' : ''} prestes a vencer!</span>
                              </h3>
                              <p className="text-zinc-400 text-xs mt-1">
                                 As seguintes demandas vencem em até 2 dias:
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                 {demandsAboutToExpire.slice(0, 5).map(d => {
                                    const deadline = new Date(d.deadline.split('T')[0] + 'T12:00:00');
                                    deadline.setHours(0, 0, 0, 0);
                                    const now = new Date();
                                    now.setHours(0, 0, 0, 0);
                                    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                    const urgencyText = diffDays === 0 ? 'HOJE!' : diffDays === 1 ? 'Amanhã' : `Em ${diffDays} dias`;
                                    const urgencyColor = diffDays === 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30';

                                    return (
                                       <button
                                          key={d.id}
                                          onClick={() => handleRowClick(d)}
                                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium hover:opacity-80 transition-all ${urgencyColor}`}
                                       >
                                          <span className="truncate max-w-[150px]">{d.title}</span>
                                          <span className="text-[10px] font-bold whitespace-nowrap">({urgencyText})</span>
                                       </button>
                                    );
                                 })}
                                 {demandsAboutToExpire.length > 5 && (
                                    <span className="text-zinc-500 text-xs self-center">
                                       +{demandsAboutToExpire.length - 5} mais
                                    </span>
                                 )}
                              </div>
                           </div>
                           <button
                              onClick={() => setShowExpirationAlert(false)}
                              className="text-zinc-500 hover:text-white transition-colors p-1"
                              title="Fechar alerta"
                           >
                              <X size={16} />
                           </button>
                        </div>
                     </div>
                  </div>
               )}


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
                  <div
                     onClick={() => setActiveTab('delayed')}
                     className="card-enterprise card-secondary relative overflow-hidden p-5 group hover:border-zinc-500/50 transition-colors cursor-pointer"
                  >
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

               {/* Tabs */}
               <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-700/50 pb-1">
                  {[
                     { id: 'backlog', label: 'BackLog' },
                     { id: 'approval', label: 'Aprovar / Agendado' },
                     { id: 'production', label: 'Em Produção' },
                     { id: 'stalled', label: 'Parado / Revisão' },
                     { id: 'completed', label: 'Concluídos' },
                  ].map((tab) => (
                     <button
                        key={tab.id}
                        onClick={() => {
                           setActiveTab(tab.id);
                        }}
                        className={`
                           px-4 py-2 text-sm font-medium rounded-t-lg transition-all relative
                           ${activeTab === tab.id
                              ? 'text-primary border-b-2 border-primary bg-zinc-800/20'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/10'}
                        `}
                     >
                        {tab.label}
                     </button>
                  ))}
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

                  {/* Designer Filter */}
                  <div className="w-full md:w-64">
                     <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                        <select
                           value={selectedDesigner}
                           onChange={(e) => setSelectedDesigner(e.target.value)}
                           className="w-full appearance-none bg-zinc-900/50 border border-zinc-700/50 rounded-[6px] py-3 pl-10 pr-8 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                        >
                           <option value="all">Todos os Responsáveis</option>
                           {designers.map(d => (
                              <option key={d.id} value={d.id}>
                                 {d.name}
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

                  {/* Date Filter */}
                  <div className="w-full md:w-auto relative z-20">
                     <button
                        onClick={() => setShowDateMenu(!showDateMenu)}
                        className="w-full md:w-56 appearance-none bg-zinc-900/50 border border-zinc-700/50 rounded-[6px] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer flex items-center justify-between"
                     >
                        <div className="flex items-center gap-2">
                           <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                           <span className="truncate pl-1">
                              {dateFilter.type === 'all' ? 'Todas as Datas' :
                                 dateFilter.type === 'this_week' ? 'Esta Semana' :
                                    dateFilter.type === 'next_week' ? 'Próxima Semana' :
                                       'Data Personalizada'}
                           </span>
                        </div>
                        <ChevronDown size={14} className={`text-zinc-500 transition-transform ${showDateMenu ? 'rotate-180' : ''}`} />
                     </button>

                     {showDateMenu && (
                        <>
                           <div className="fixed inset-0 z-10" onClick={() => setShowDateMenu(false)} />
                           <div className="absolute top-full right-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl p-2 z-20 flex flex-col gap-1">
                              <button
                                 onClick={() => handleDateFilterChange('all')}
                                 className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors ${dateFilter.type === 'all' ? 'bg-zinc-800 text-white' : ''}`}
                              >
                                 Todas as Datas
                              </button>
                              <button
                                 onClick={() => handleDateFilterChange('this_week')}
                                 className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors ${dateFilter.type === 'this_week' ? 'bg-zinc-800 text-white' : ''}`}
                              >
                                 Esta Semana
                              </button>
                              <button
                                 onClick={() => handleDateFilterChange('next_week')}
                                 className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors ${dateFilter.type === 'next_week' ? 'bg-zinc-800 text-white' : ''}`}
                              >
                                 Próxima Semana
                              </button>
                              <button
                                 onClick={() => handleDateFilterChange('custom')}
                                 className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors ${dateFilter.type === 'custom' ? 'bg-zinc-800 text-white' : ''}`}
                              >
                                 Data Personalizada
                              </button>

                              {dateFilter.type === 'custom' && (
                                 <div className="p-3 bg-zinc-950/50 rounded-lg mt-1 border border-zinc-800 flex flex-col gap-2">
                                    <div className="flex flex-col gap-1">
                                       <span className="text-xs text-zinc-500">Início</span>
                                       <input
                                          type="date"
                                          value={customDateStart}
                                          onChange={(e) => setCustomDateStart(e.target.value)}
                                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white [color-scheme:dark]"
                                       />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                       <span className="text-xs text-zinc-500">Fim</span>
                                       <input
                                          type="date"
                                          value={customDateEnd}
                                          onChange={(e) => setCustomDateEnd(e.target.value)}
                                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white [color-scheme:dark]"
                                       />
                                    </div>
                                    <button
                                       onClick={applyCustomDateFilter}
                                       className="w-full mt-1 bg-primary text-black text-xs font-bold py-1.5 rounded hover:bg-primary-hover"
                                    >
                                       Aplicar Filtro
                                    </button>
                                 </div>
                              )}
                           </div>
                        </>
                     )}
                  </div>

               </div>

               {/* Table */}
               <div className="card-enterprise w-full overflow-hidden relative min-h-[400px] border border-zinc-800">
                  {loading && <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 z-10"><span className="text-white">Carregando...</span></div>}

                  <div className="w-full">
                     <table className="w-full table-fixed border-collapse text-center text-sm table-zebra table-hover">
                        <thead>
                           <tr className="border-b border-zinc-800 bg-zinc-900/50 text-contrast-sub">
                              {/* Bulk Selection Checkbox - DISABLED */}
                              {/* <th className="px-2 py-3 w-[3%]">
                                 <input
                                    type="checkbox"
                                    checked={bulkSelection.isAllVisibleSelected && paginatedDemands.length > 0}
                                    onChange={(e) => {
                                       e.stopPropagation();
                                       bulkSelection.toggleSelectAll();
                                    }}
                                    className="size-4 rounded border-zinc-600 bg-zinc-800 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                                 />
                              </th> */}
                              <th className="px-2 py-3 font-medium text-zinc-400 text-[10px] uppercase tracking-wider whitespace-nowrap w-[9%]">
                                 Código
                              </th>
                              <th
                                 className="px-2 py-3 font-medium text-zinc-400 text-[10px] uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap w-[18%]"
                                 onClick={() => handleSort('title')}
                              >
                                 <div className="flex items-center gap-1">
                                    Título
                                    {sortConfig.key === 'title' && (
                                       <ArrowUpDown size={12} className={sortConfig.direction ? "text-primary" : "text-zinc-600"} />
                                    )}
                                 </div>
                              </th>
                              <th className="px-2 py-3 font-medium text-zinc-400 text-[10px] uppercase tracking-wider whitespace-nowrap w-[7%]">Prior.</th>
                              <th className="px-2 py-3 font-medium text-zinc-400 text-[10px] uppercase tracking-wider whitespace-nowrap w-[12%]">Designer</th>
                              <th className="px-2 py-3 font-medium text-zinc-400 text-[10px] uppercase tracking-wider whitespace-nowrap w-[10%]">Status</th>
                              <th
                                 className="px-2 py-3 font-medium text-zinc-400 text-[10px] uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap w-[8%]"
                                 onClick={() => handleSort('time')}
                              >
                                 <div className="flex items-center gap-1">
                                    Tempo
                                    {sortConfig.key === 'time' && (
                                       <ArrowUpDown size={12} className={sortConfig.direction ? "text-primary" : "text-zinc-600"} />
                                    )}
                                 </div>
                              </th>
                              <th
                                 className="px-2 py-3 font-medium text-zinc-400 text-[10px] uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap w-[11%]"
                                 onClick={() => handleSort('deadline')}
                              >
                                 <div className="flex items-center gap-1">
                                    Prazo
                                    {sortConfig.key === 'deadline' && (
                                       <ArrowUpDown size={12} className={sortConfig.direction ? "text-primary" : "text-zinc-600"} />
                                    )}
                                 </div>
                              </th>
                              <th className="px-2 py-3 font-medium text-zinc-400 text-[10px] uppercase tracking-wider whitespace-nowrap w-[10%]">Tipo</th>
                              <th className="px-2 py-3 font-medium text-zinc-400 text-[10px] uppercase tracking-wider whitespace-nowrap w-[8%]">Entrega</th>
                              <th className="px-2 py-3 text-right font-medium text-zinc-400 text-[10px] uppercase tracking-wider whitespace-nowrap w-[4%]">Ação</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                           {paginatedDemands.length === 0 && !loading && (
                              <tr>
                                 <td colSpan={11} className="px-6 py-8 text-center text-zinc-500">
                                    Nenhuma demanda encontrada.
                                 </td>
                              </tr>
                           )}
                           {paginatedDemands.map((item) => (
                              <tr
                                 key={item.id}
                                 onClick={() => handleRowClick(item)}
                                 className="group transition-colors relative cursor-pointer hover:bg-zinc-800/30"
                              >
                                 {/* Bulk Selection Checkbox - DISABLED */}
                                 {/* <td className="px-2 py-4">
                                    <input
                                       type="checkbox"
                                       checked={bulkSelection.isSelected(item.id)}
                                       onChange={(e) => {
                                          e.stopPropagation();
                                          bulkSelection.toggleSelection(item.id);
                                       }}
                                       onClick={(e) => e.stopPropagation()}
                                       className="size-4 rounded border-zinc-600 bg-zinc-800 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                                    />
                                 </td> */}
                                 <td className="px-2 py-4 whitespace-nowrap">
                                    <span className="font-mono text-[10px] text-zinc-400">
                                       {demandIdMap.get(item.id) || '-'}
                                    </span>
                                 </td>
                                 <td className="px-2 py-4">
                                    <span className="table-content-title font-display font-medium text-white text-xs truncate block whitespace-nowrap overflow-hidden" title={item.title}>
                                       {item.title}
                                    </span>
                                 </td>
                                 <td className="px-2 py-4 whitespace-nowrap">
                                    {(() => {
                                       const p = item.priority || 'Média';
                                       const colorClass = p === 'Alta' ? 'text-red-400' :
                                          p === 'Baixa' ? 'text-blue-400' :
                                             'text-yellow-400';
                                       const Icon = p === 'Alta' ? Flag : p === 'Baixa' ? Flag : Flag;

                                       return (
                                          <div className={`flex items-center gap-1 ${colorClass}`}>
                                             <Icon size={12} fill="currentColor" className="opacity-80" />
                                             <span className="text-[10px] font-semibold">{p}</span>
                                          </div>
                                       );
                                    })()}
                                 </td>
                                 <td className="px-2 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                       <div className="h-5 w-5 overflow-hidden rounded-full bg-zinc-800 border border-zinc-700 shrink-0">
                                          {item.responsible?.avatar_url ? (
                                             <img src={item.responsible.avatar_url} alt={item.responsible.name} className="h-full w-full object-cover" />
                                          ) : (
                                             <div className="h-full w-full flex items-center justify-center text-[8px] text-zinc-400 uppercase font-bold">{item.responsible?.name?.slice(0, 2) || '?'}</div>
                                          )}
                                       </div>
                                       <span className="text-[10px] font-medium text-zinc-300 truncate max-w-[80px]">{item.responsible?.name || '-'}</span>
                                    </div>
                                 </td>
                                 <td className="px-2 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide ring-1 ring-inset whitespace-nowrap ${item.statuses?.color ? 'text-white' : 'text-zinc-400'} ${item.statuses?.color || 'bg-zinc-800 ring-zinc-700'}`}>
                                       {item.statuses?.name || '-'}
                                    </span>
                                 </td>
                                 <td className="px-2 py-4 whitespace-nowrap">
                                    <DemandTimerBadge
                                       statusName={item.statuses?.name}
                                       productionStartedAt={item.production_started_at}
                                       accumulatedTime={item.accumulated_time}
                                    />
                                 </td>
                                 <td className="px-2 py-4 whitespace-nowrap">
                                    <div className="flex flex-col items-center">
                                       <span className="text-[10px] font-medium text-zinc-300">
                                          {item.deadline ? new Date(item.deadline.split('T')[0] + 'T12:00:00').toLocaleDateString() : '-'}
                                       </span>
                                       {(() => {
                                          if (!item.deadline) return null;
                                          const deadline = new Date(item.deadline.split('T')[0] + 'T12:00:00');
                                          const now = new Date();
                                          deadline.setHours(0, 0, 0, 0);
                                          now.setHours(0, 0, 0, 0);

                                          const diffTime = deadline.getTime() - now.getTime();
                                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                          const s = item.statuses?.name?.toLowerCase() || '';
                                          const isCompleted = s.includes('conclu') || s.includes('agendado') || s.includes('postar');

                                          if (isCompleted) return null;

                                          if (diffDays < 0) {
                                             return <span className="text-[8px] text-red-500 font-bold uppercase">Atrasado</span>;
                                          } else if (diffDays <= 2) {
                                             return <span className="text-[8px] text-yellow-500 font-bold uppercase">{diffDays === 0 ? 'Hoje' : diffDays + 'd'}</span>;
                                          }
                                          return null;
                                       })()}
                                    </div>
                                 </td>

                                 <td className="px-2 py-4 whitespace-nowrap">
                                    <span className="text-zinc-400 text-[10px] whitespace-nowrap truncate block" title={item.demand_types?.name}>{item.demand_types?.name || '-'}</span>
                                 </td>
                                 <td className="px-2 py-4 whitespace-nowrap">
                                    {(() => {
                                       const s = item.statuses?.name?.toLowerCase() || '';
                                       const isDelivered = s.includes('agendado') ||
                                          s.includes('ag.odds') ||
                                          s.includes('postar') ||
                                          s.includes('ap.gerente') ||
                                          s.includes('gerente') ||
                                          s.includes('conclu') ||
                                          s.includes('entregue');

                                       if (!isDelivered || !item.updated_at) return <span className="text-zinc-600 text-[10px]">-</span>;

                                       return (
                                          <span className="text-zinc-300 text-[10px]">
                                             {new Date(item.updated_at).toLocaleDateString()}
                                          </span>
                                       );
                                    })()}
                                 </td>
                                 <td className="px-2 py-4 text-right whitespace-nowrap">
                                    <button
                                       onClick={(e) => toggleMenu(e, item)}
                                       className="h-6 w-6 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors flex items-center justify-center"
                                    >
                                       <MoreVertical size={12} />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>

                  {/* Pagination */}
                  {sortedDemands.length > 0 && (
                     <div className="border-t border-zinc-800 px-4">
                        <Pagination
                           page={pagination.page}
                           totalPages={pagination.totalPages}
                           totalItems={pagination.totalItems}
                           pageSize={pagination.pageSize}
                           onPageChange={pagination.setPage}
                           onPageSizeChange={pagination.setPageSize}
                           pageSizeOptions={[10, 20, 50, 100]}
                        />
                     </div>
                  )}
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
               demandIdCode={selectedDemand && selectedDemand.id ? demandIdMap.get(selectedDemand.id) : undefined}
            />
         </SlideOver>

         {/* Bulk Actions Bar - TEMPORARILY DISABLED */}
         {/* <BulkActionsBar
            selectedCount={bulkSelection.selectedCount}
            onClearSelection={bulkSelection.clearSelection}
            onChangeStatus={handleBulkStatusChange}
            onAssignDesigner={handleBulkAssignDesigner}
            onDelete={handleBulkDelete}
            statuses={statuses}
            designers={designers}
            isLoading={bulkLoading}
         /> */}

      </div >
   );
};

export default DemandsPage;
