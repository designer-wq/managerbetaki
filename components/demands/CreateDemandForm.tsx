import React, { useState, useEffect, useRef } from 'react';
import { Info, Grid, Calendar, FileText, Lock, ChevronDown, Link as LinkIcon, Bold, Italic, List, Image as ImageIcon, ArrowRight, Clock, MessageSquare, History, ExternalLink, Send, Flag, Check, CheckCircle } from 'lucide-react';
import { fetchTable, createRecord, updateRecord, fetchComments, fetchLogs, upsertRecord, fetchByColumn } from '../../lib/api';
import { useToast } from '../../components/ui/ToastContext';
import { useDemandTimer } from '../../hooks/useDemandTimer';
import DemandComments from './DemandComments';

import { useAuth } from '../../contexts/AuthContext';

interface CreateDemandFormProps {
    onCancel?: () => void;
    onSuccess?: () => void;
    initialData?: any;
    demandIdCode?: string;
}

interface CustomStatus {
    id: string;
    name: string;
    color: string;
}

const CreateDemandForm: React.FC<CreateDemandFormProps> = ({
    initialData = null,
    demandIdCode,
    onCancel,
    onSuccess
}) => {
    const { addToast } = useToast();
    const { user: authUser, profile } = useAuth();

    // Unified user object
    const currentUser = profile || (authUser ? {
        id: authUser.id,
        name: authUser.email?.split('@')[0] || 'User',
        role: 'User',
        avatar_url: authUser.user_metadata?.avatar_url,
        email: authUser.email
    } : null);

    const isEditMode = !!initialData?.id;

    // Data State
    const [origins, setOrigins] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<CustomStatus[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [statusId, setStatusId] = useState(initialData?.status_id || "");
    const [driveLink, setDriveLink] = useState(initialData?.drive_link || "");

    // Comment State
    const [newComment, setNewComment] = useState("");
    const [sendingComment, setSendingComment] = useState(false);

    // Refs for inputs
    const titleRef = useRef<HTMLInputElement>(null);
    const priorityRef = useRef<HTMLSelectElement>(null);
    const refLinkRef = useRef<HTMLInputElement>(null);
    const designerRef = useRef<HTMLSelectElement>(null);
    const typeRef = useRef<HTMLSelectElement>(null);
    const originRef = useRef<HTMLSelectElement>(null);
    const deadlineRef = useRef<HTMLInputElement>(null);

    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const captionRef = useRef<HTMLTextAreaElement>(null);

    const insertFormat = (format: string) => {
        const textarea = descriptionRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        let prefix = '';
        let suffix = '';

        switch (format) {
            case 'bold': prefix = '**'; suffix = '**'; break;
            case 'italic': prefix = '*'; suffix = '*'; break;
            case 'list': prefix = '\n- '; suffix = ''; break;
        }

        const newText = text.substring(0, start) + prefix + text.substring(start, end) + suffix + text.substring(end);
        textarea.value = newText;
        autoSaveField('description', newText, true);
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    };

    // Remove old localStorage effect purely (replaced by useAuth)

    // Fetch Options & Data
    // Fetch Options & Data
    useEffect(() => {
        const loadOptions = async () => {
            const { getSupabase } = await import('../../lib/supabase');
            const supabase = getSupabase();

            // Parallel fetch: Standard tables + Auth Users RPC
            const [o, t, s] = await Promise.all([
                fetchTable('origins'),
                fetchTable('demand_types'),
                fetchTable('statuses')
            ]);

            // User Fetching Strategy: RPC -> Filter by 'Designer' (Case insensitive just in case)
            let filteredDesigners: any[] = [];
            try {
                if (supabase) {
                    const { data: authUsers, error } = await (supabase as any).rpc('get_auth_users_list');
                    if (!error && authUsers) {
                        // Filter: Must be 'active' AND have job_title 'Designer'
                        filteredDesigners = authUsers.filter((u: any) =>
                            u.status === 'active' &&
                            u.job_title_name &&
                            u.job_title_name.toLowerCase().includes('designer')
                        );
                    }
                }
            } catch (err) {
                console.error("Error fetching designers:", err);
            }

            setOrigins(o || []);
            setTypes(t || []);
            setStatuses(s || []);
            setProfiles(filteredDesigners);

            // Set default status if new
            if (!initialData && s && s.length > 0) {
                const backlogStatus = s.find((st: any) => st.name.toLowerCase() === 'backlog');
                const defaultStatus = backlogStatus || s.find((st: any) => st.order === 1) || s[0];
                setStatusId(defaultStatus.id);
            }

            // Load extra data if edit mode
            if (isEditMode) {
                const [c, l] = await Promise.all([
                    fetchComments(initialData.id),
                    fetchLogs(initialData.id)
                ]);
                setComments(c || []);
                setLogs(l || []);
            }

            setLoading(false);
        };
        loadOptions();
    }, [initialData, isEditMode]);

    // Status Menu State
    const [showStatusMenu, setShowStatusMenu] = useState(false);

    // Helper: Get Status Object
    const currentStatus = statuses.find(s => s.id === statusId);

    // Timer Logic: Immediate visual feedback
    // --- Timer Logic (Auto-Save) ---
    const [timerState, setTimerState] = useState({
        production_started_at: initialData?.production_started_at || null,
        accumulated_time: initialData?.accumulated_time || 0
    });

    useEffect(() => {
        if (initialData) {
            setTimerState({
                production_started_at: initialData.production_started_at,
                accumulated_time: initialData.accumulated_time || 0
            });
        }
    }, [initialData]);


    const getCurrentStatusLabel = () => {
        const s = statuses.find(st => st.id === statusId);
        return s?.name || 'Carregando...';
    };

    const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    useEffect(() => {
        return () => {
            for (const k in saveTimers.current) {
                const t = saveTimers.current[k];
                if (t) clearTimeout(t as unknown as number);
            }
            saveTimers.current = {};
        };
    }, []);

    const autoSaveField = (field: string, value: any, silent = false) => {
        if (!isEditMode || !initialData?.id) return;
        const run = async () => {
            try {
                await updateRecord('demands', initialData.id, { [field]: value === '' ? null : value }, currentUser?.id);
                if (!silent) addToast('Alteração salva', 'success');
            } catch (err) {
                addToast('Erro ao salvar automaticamente', 'error');
            }
        };
        if (typeof value === 'string') {
            if (saveTimers.current[field]) clearTimeout(saveTimers.current[field]);
            saveTimers.current[field] = setTimeout(run, 600);
        } else {
            run();
        }
    };

    const handleStatusChange = async (newStatusId: string) => {
        setShowStatusMenu(false); // Close menu
        const oldStatusId = statusId;
        setStatusId(newStatusId); // Update local generic status state

        // Only apply persistent timer logic if in Edit Mode
        if (!initialData?.id) return;

        const newStatusObj = statuses.find(s => s.id === newStatusId);
        const oldStatusObj = statuses.find(s => s.id === oldStatusId);

        const isNewProduction = newStatusObj?.name.toLowerCase().includes('produção');
        const isOldProduction = oldStatusObj?.name.toLowerCase().includes('produção');

        // Build single update payload to avoid duplicate logs
        let updates: any = { status_id: newStatusId };
        let newTimerState = { ...timerState };

        if (!isOldProduction && isNewProduction) {
            // Started Production
            const now = new Date().toISOString();
            updates.production_started_at = now;
            newTimerState.production_started_at = now;
        }
        else if (isOldProduction && !isNewProduction) {
            // Stopped Production
            if (timerState.production_started_at) {
                const start = new Date(timerState.production_started_at).getTime();
                const now = new Date().getTime();
                const sessionSeconds = Math.max(0, Math.floor((now - start) / 1000));

                updates.production_started_at = null;
                updates.accumulated_time = (timerState.accumulated_time || 0) + sessionSeconds;

                newTimerState.production_started_at = null;
                newTimerState.accumulated_time = updates.accumulated_time;
            }
        }

        // Persist updates in a single call
        try {
            await updateRecord('demands', initialData.id, updates, currentUser?.id);
            try {
                const refreshed: any = await fetchByColumn('demands', 'id', initialData.id);
                if (refreshed && refreshed.status_id) {
                    setStatusId(refreshed.status_id);
                } else {
                    setStatusId(newStatusId);
                }
            } catch (_) {
                setStatusId(newStatusId);
            }
            setTimerState(newTimerState);

            if (isNewProduction) {
                addToast('Cronômetro iniciado e status salvo', 'success');
            } else if (isOldProduction) {
                addToast('Tempo contabilizado e status salvo', 'success');
            } else {
                addToast('Status atualizado com sucesso', 'success');
            }

            // Verify persistence without logging again
            try {
                const refreshed: any = await fetchByColumn('demands', 'id', initialData.id);
                if (refreshed && String(refreshed.status_id || '') !== String(newStatusId)) {
                    const { getSupabase } = await import('../../lib/supabase');
                    const supabase = getSupabase();
                    if (supabase) {
                        await (supabase as any)
                            .from('demands')
                            .update({ status_id: newStatusId })
                            .eq('id', initialData.id);
                    }
                }
            } catch (_) { }
        } catch (err) {
            console.error("Auto-save error:", err);
            addToast('Erro ao salvar status automático', 'error');
        }
    };

    // Timer Hook
    const { time: timerDisplay, isRunning } = useDemandTimer({
        statusName: getCurrentStatusLabel(),
        productionStartedAt: timerState.production_started_at,
        accumulatedTime: timerState.accumulated_time
    });

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} `;
    };

    const getCurrentStatusColor = () => {
        const s = statuses.find(st => st.id === statusId);
        return s?.color || 'bg-zinc-700';
    };



    const handleSubmit = async () => {
        console.log('Submitting demand...');
        // 1. Basic Validation
        if (!titleRef.current?.value || !typeRef.current?.value || !deadlineRef.current?.value) {
            addToast('Por favor, preencha os campos obrigatórios (Título, Tipo, Prazo).', 'error');
            return;
        }

        if (!statusId) {
            addToast('Status não definido. Aguarde o carregamento ou recarregue a página.', 'error');
            return;
        }

        setSaving(true);
        // 2. Prepare Payload (Sanitize UUIDs)
        const demandData = {
            title: titleRef.current.value,
            reference_link: refLinkRef.current?.value || '',
            drive_link: driveLink,
            priority: priorityRef.current?.value || 'Média',
            origin_id: originRef.current?.value || null, // Ensure "" becomes null
            type_id: typeRef.current.value,
            status_id: statusId,
            responsible_id: designerRef.current?.value || null, // Ensure "" becomes null
            deadline: deadlineRef.current.value,
            description: descriptionRef.current?.value || '',
            caption: captionRef.current?.value || '',
            goal: '',
            production_started_at: timerState.production_started_at,
            accumulated_time: timerState.accumulated_time,
            created_by: currentUser?.id || null // Fix for "created_by" constraint
        };

        console.log('Demand Payload:', demandData);

        try {
            const userId = currentUser ? currentUser.id : undefined;
            if (isEditMode) {
                const updated = await updateRecord('demands', initialData.id, demandData, userId);
                if (!updated?.id) {
                    addToast('Falha ao salvar a demanda. Verifique a conexão Supabase.', 'error');
                    setSaving(false);
                    return;
                }
                addToast('Demanda atualizada com sucesso!', 'success');
            } else {
                const created = await createRecord('demands', demandData, userId);
                if (!created?.id) {
                    addToast('Falha ao criar a demanda. Verifique a integração Supabase em Configurações.', 'error');
                    setSaving(false);
                    return;
                }
                addToast('Demanda criada com sucesso!', 'success');
            }
            if (onSuccess) onSuccess();
            if (onCancel) onCancel();
        } catch (error: any) {
            console.error('Error saving demand:', error);

            // 3. User Friendly Error Handling
            if (error?.code === 'PGRST204' || error?.message?.includes('Could not find the')) {
                addToast('ERRO DE SISTEMA: Banco desatualizado. Contate suporte.', 'error');
            } else if (error?.code === '22P02') {
                addToast('ERRO DE DADOS: Campo inválido enviado.', 'error');
            } else {
                addToast(`Erro ao salvar demanda: ${error.message || 'Erro desconhecido'}`, 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSendComment = async () => {
        if (!newComment.trim() || !currentUser || !isEditMode) return;
        setSendingComment(true);
        try {
            await createRecord('comments', {
                demand_id: initialData.id,
                user_id: currentUser.id,
                content: newComment
            }, currentUser.id);
            setNewComment("");
            const updatedComments = await fetchComments(initialData.id);
            setComments(updatedComments || []);
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar comentário.');
        } finally {
            setSendingComment(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-zinc-400">Carregando formulário...</div>;
    }

    // Helper for reference link display (clickable label requested)
    // The requirement: "os campos de link de referencia e arquivos Drive deve aparecer na label e clicavel"
    // Interpretation: The label itself or an icon next to it should be clickable if the link exists.
    // For the input, we keep it editable. We can add an external link icon.

    const referenceLinkValue = refLinkRef.current?.value || initialData?.reference_link || '';

    return (
        <div className="flex flex-col gap-6">

            {/* Main Content Container */}
            <div className="bg-zinc-800 rounded-xl p-6 md:p-8 border border-zinc-700 shadow-xl">

                {isEditMode ? (
                    <>


                        {/* Top Status Bar */}
                        <div className="mb-8 w-full">
                            <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-visible z-20">

                                {/* Status Indicator Line (Optional visual flair) */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${getCurrentStatusColor()}`} />

                                {/* Left: Status Label / Dropdown */}
                                <div className="flex-1 flex justify-start items-center gap-3 relative">
                                    <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider hidden md:block">Status</span>

                                    <div className="relative">
                                        <button
                                            onClick={() => setShowStatusMenu(!showStatusMenu)}
                                            className={`
                                                px-5 py-2 rounded-full font-bold text-sm tracking-wide uppercase text-white shadow-md 
                                                flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer ring-offset-2 ring-offset-zinc-900 focus:ring-2
                                                ${getCurrentStatusColor()}
                                            `}
                                        >
                                            {getCurrentStatusLabel()}
                                            <ChevronDown size={14} className={`transition-transform duration-200 ${showStatusMenu ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Custom Dropdown Menu */}
                                        {showStatusMenu && (
                                            <>
                                                {/* Backdrop to close */}
                                                <div className="fixed inset-0 z-10 cursor-default" onClick={() => setShowStatusMenu(false)}></div>

                                                {/* Menu List */}
                                                <div className="absolute top-full left-0 mt-2 w-[220px] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200">
                                                    {statuses.map(s => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => handleStatusChange(s.id)}
                                                            className={`
                                                                w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide text-white transition-all
                                                                hover:scale-[1.02] flex items-center justify-between group
                                                                ${s.color}
                                                            `}
                                                        >
                                                            {s.name}
                                                            {statusId === s.id && <Check size={14} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Center: Timer */}
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">Tempo em Produção</span>
                                    {isRunning ? (
                                        <div className="flex items-center gap-2 text-white font-mono text-3xl font-bold tracking-wider">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-pulse"></div>
                                                <Clock size={24} className="text-primary relative z-10 animate-pulse" />
                                            </div>
                                            <span className="tabular-nums relative z-10">{timerDisplay}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-zinc-400 font-mono text-2xl font-medium tracking-wider">
                                            <Clock size={20} />
                                            <span className="tabular-nums">{timerDisplay}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Save Button */}
                                <div className="flex-1 flex justify-end">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5"
                                    >
                                        <CheckCircle size={18} />
                                        <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Layout - Two Columns */}
                        <div className="flex gap-6">

                            {/* Left Column - Scrollable: Description, Caption, Comments, Timeline */}
                            <div className="flex-1 flex flex-col gap-6 min-w-0">

                                {/* Description */}
                                <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-700/50">
                                    <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                        <FileText className="text-primary" size={20} />
                                        Descrição
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <label className="flex flex-col w-full">
                                            <p className="text-white text-sm font-medium leading-normal pb-2">Detalhes do briefing</p>
                                            <div className="relative flex flex-col">
                                                {/* Formatting Toolbar */}
                                                <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 border-b-0 rounded-t-lg p-2">
                                                    <button onClick={() => insertFormat('bold')} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors" title="Negrito">
                                                        <Bold size={14} />
                                                    </button>
                                                    <button onClick={() => insertFormat('italic')} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors" title="Itálico">
                                                        <Italic size={14} />
                                                    </button>
                                                    <div className="w-px h-4 bg-zinc-700 mx-1"></div>
                                                    <button onClick={() => insertFormat('list')} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors" title="Lista">
                                                        <List size={14} />
                                                    </button>
                                                </div>
                                                <textarea ref={descriptionRef} defaultValue={initialData?.description} onChange={(e) => autoSaveField('description', e.target.value, true)} className="w-full min-h-[200px] rounded-b-lg rounded-t-none text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 placeholder:text-zinc-500 p-4 text-sm resize-y focus:border-primary" placeholder="Descreva os requisitos, copy e instruções específicas para esta demanda..."></textarea>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Caption (Legenda Instagram) */}
                                <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-700/50">
                                    <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                        📝 Legenda (Instagram)
                                    </h3>
                                    <label className="flex flex-col w-full">
                                        <div className="relative flex flex-col">
                                            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 border-b-0 rounded-t-lg p-2.5">
                                                <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                                                    COPY PARA LEGENDA
                                                </span>
                                            </div>
                                            <textarea ref={captionRef} defaultValue={initialData?.caption} onChange={(e) => autoSaveField('caption', e.target.value, true)} className="w-full min-h-[250px] rounded-b-lg rounded-t-none text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 placeholder:text-zinc-500 p-4 text-sm resize-y focus:border-primary" placeholder="Escreva a legenda aqui..."></textarea>
                                        </div>
                                    </label>
                                </div>

                                {/* Comments */}
                                <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-700/50">
                                    <DemandComments
                                        demandId={initialData.id}
                                        demandTitle={initialData.title}
                                    />
                                </div>

                                {/* Timeline */}
                                <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-700/50">
                                    <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                        <History size={18} className="text-zinc-400" />
                                        Linha do Tempo
                                    </h3>
                                    <div className="flex flex-col gap-4 pl-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {logs.filter((item) => item?.details?.status_id).length === 0 ? (
                                            <div className="text-zinc-500 text-sm">Sem histórico.</div>
                                        ) : (
                                            logs.filter((item) => item?.details?.status_id).map((item) => (
                                                <div key={item.id} className="relative pl-4 border-l border-zinc-700 last:border-0 pb-1">
                                                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-600 ring-4 ring-zinc-900"></div>
                                                    <p className="text-zinc-300 text-sm leading-tight">
                                                        {item.action === 'CREATE' ? 'Demanda Criada' :
                                                            item.action === 'UPDATE' ? 'Demanda Atualizada' : item.action}
                                                    </p>
                                                    <p className="text-zinc-500 text-xs mt-1">
                                                        {item.profiles?.name || 'Sistema'} • {new Date(item.created_at).toLocaleString()}
                                                    </p>
                                                    {item.details && item.details.status_id && (() => {
                                                        const st = statuses.find(s => s.id === item.details.status_id);
                                                        return (
                                                            <div className="mt-0.5">
                                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ring-1 ring-inset ${st?.color ? 'text-white' : 'text-zinc-400'} ${st?.color || 'bg-zinc-800 ring-zinc-700'}`}>
                                                                    {st?.name || 'Indefinido'}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* Right Column - Sticky: Basic Info, Classification, Schedule */}
                            <div className="w-[380px] shrink-0 hidden lg:block">
                                <div className="sticky top-0 flex flex-col gap-6">

                                    {/* Basic Info */}
                                    <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-700/50">
                                        <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                            <Info className="text-primary" size={20} />
                                            Informações Básicas
                                        </h3>
                                        <div className="flex flex-col gap-4">
                                            <label className="flex flex-col w-full">
                                                <p className="text-white text-sm font-medium leading-normal pb-2 flex items-center justify-between">
                                                    <span>Título <span className="text-red-400">*</span></span>
                                                    {demandIdCode && <span className="text-zinc-500 font-mono text-xs">{demandIdCode}</span>}
                                                </p>
                                                <input ref={titleRef} defaultValue={initialData?.title} onChange={(e) => autoSaveField('title', e.target.value, true)} className="w-full h-11 rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 placeholder:text-zinc-500 px-4 text-sm transition-all focus:border-primary" placeholder="ex: Campanha Black Friday 2024" />
                                            </label>

                                            {/* Reference Link */}
                                            <label className="flex flex-col w-full">
                                                <div className="flex items-center justify-between pb-2">
                                                    <p className="text-white text-sm font-medium leading-normal">Link de Referência</p>
                                                    {initialData?.reference_link && (
                                                        <a href={initialData.reference_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                                            <span>Abrir</span>
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                                                        <LinkIcon size={16} />
                                                    </span>
                                                    <input ref={refLinkRef} defaultValue={initialData?.reference_link} onChange={(e) => autoSaveField('reference_link', e.target.value, true)} className="w-full h-11 rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 placeholder:text-zinc-500 pl-10 pr-4 text-sm transition-all focus:border-primary" placeholder="Cole a URL aqui..." />
                                                </div>
                                            </label>

                                            {/* Drive Link */}
                                            <label className="flex flex-col w-full">
                                                <div className="flex items-center justify-between pb-2">
                                                    <p className="text-white text-sm font-medium leading-normal">Arquivo do Drive</p>
                                                    {driveLink && (
                                                        <a href={driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                                            <span>Abrir</span>
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                                                        <div className="w-[16px] h-[16px]">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87.3 78" className="w-full h-full opacity-60 grayscale">
                                                                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l18.25-31.45-6.65-11.55L6.6 66.85z" fill="#0066da" />
                                                                <path d="M43.65 25 13.75 25c-1.6 0-3.05.45-4.3 1.2l-3.35 5.8 25.3 43.85 6.65-11.55L43.65 25z" fill="#00ac47" />
                                                                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l9.6-16.65c.8-1.4.2-2.95-.6-4.3L46.95.85c-.8-1.4-2.3-2.25-3.3-2.25H29.1L49 35.15l24.55 41.65z" fill="#ea4335" />
                                                                <path d="M43.65 25 29.1 0 13.75 25h29.9z" fill="#00832d" />
                                                                <path d="M29.1 0 13.75 25h6.6L49 35.15 29.1 0z" fill="#2684fc" />
                                                                <path d="M72.2 44.95H49l19.9 31.05 4.35-7.55c.8-1.4 1.4-2.95 1.45-4.3l.05-4.3c-.05-1.4-.65-2.95-1.45-4.3l-1.05-1.85z" fill="#ffba00" />
                                                            </svg>
                                                        </div>
                                                    </span>
                                                    <input value={driveLink} onChange={(e) => { setDriveLink(e.target.value); autoSaveField('drive_link', e.target.value); }} className="w-full h-11 rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 placeholder:text-zinc-500 pl-10 pr-4 text-sm transition-all focus:border-primary" placeholder="Cole o link do Google Drive..." />
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Classification */}
                                    <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-700/50">
                                        <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                            <Grid className="text-primary" size={20} />
                                            Classificação
                                        </h3>
                                        <div className="flex flex-col gap-4">
                                            <label className="flex flex-col w-full">
                                                <p className="text-white text-sm font-medium leading-normal pb-2">Prioridade</p>
                                                <div className="relative">
                                                    <select ref={priorityRef} defaultValue={initialData?.priority || "Média"} onChange={(e) => autoSaveField('priority', e.target.value)} className="w-full h-11 rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 px-4 text-sm appearance-none cursor-pointer focus:border-primary">
                                                        <option value="Alta">Alta</option>
                                                        <option value="Média">Média</option>
                                                        <option value="Baixa">Baixa</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                                    <Flag className="absolute right-10 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                                </div>
                                            </label>
                                            <label className="flex flex-col w-full">
                                                <p className="text-white text-sm font-medium leading-normal pb-2">Responsável</p>
                                                <div className="relative">
                                                    <select ref={designerRef} defaultValue={initialData?.responsible_id || ""} onChange={(e) => autoSaveField('responsible_id', e.target.value || null)} className="w-full h-11 rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 px-4 text-sm appearance-none cursor-pointer focus:border-primary">
                                                        <option disabled value="">Selecione</option>
                                                        {profiles.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                                </div>
                                            </label>
                                            <label className="flex flex-col w-full">
                                                <p className="text-white text-sm font-medium leading-normal pb-2">Tipo <span className="text-red-400">*</span></p>
                                                <div className="relative">
                                                    <select ref={typeRef} defaultValue={initialData?.type_id || ""} onChange={(e) => autoSaveField('type_id', e.target.value)} className="w-full h-11 rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 px-4 text-sm appearance-none cursor-pointer focus:border-primary">
                                                        <option disabled value="">Selecione</option>
                                                        {types.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                                </div>
                                            </label>
                                            <label className="flex flex-col w-full">
                                                <p className="text-white text-sm font-medium leading-normal pb-2">Origem</p>
                                                <div className="relative">
                                                    <select ref={originRef} defaultValue={initialData?.origin_id || ""} onChange={(e) => autoSaveField('origin_id', e.target.value || null)} className="w-full h-11 rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 px-4 text-sm appearance-none cursor-pointer focus:border-primary">
                                                        <option disabled value="">Selecione</option>
                                                        {origins.map(o => (
                                                            <option key={o.id} value={o.id}>{o.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Schedule */}
                                    <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-700/50">
                                        <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                            <Calendar className="text-primary" size={20} />
                                            Cronograma
                                        </h3>
                                        <div className="flex flex-col gap-4">
                                            <label className="flex flex-col w-full">
                                                <p className="text-white text-sm font-medium leading-normal pb-2">Data da Solicitação</p>
                                                <div className="relative">
                                                    <input className="w-full h-11 rounded-lg text-zinc-400 bg-zinc-700/50 border border-zinc-600 px-4 text-sm cursor-not-allowed opacity-70" disabled value={initialData?.created_at ? new Date(initialData.created_at).toLocaleDateString() : new Date().toLocaleDateString()} />
                                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                                </div>
                                            </label>
                                            <label className="flex flex-col w-full">
                                                <p className="text-white text-sm font-medium leading-normal pb-2 flex items-center justify-between">
                                                    <span>Prazo <span className="text-red-400">*</span></span>
                                                    {initialData?.deadline && (() => {
                                                        const deadline = new Date(initialData.deadline.split('T')[0] + 'T12:00:00');
                                                        const now = new Date();
                                                        deadline.setHours(0, 0, 0, 0);
                                                        now.setHours(0, 0, 0, 0);
                                                        const diffTime = deadline.getTime() - now.getTime();
                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                        const isCompleted = ['concluído', 'entregue', 'finalizado'].includes((initialData.statuses?.name || '').toLowerCase());

                                                        if (isCompleted) return <span className="text-[10px] text-[#bcd200] font-bold uppercase tracking-wide bg-[#bcd200]/10 px-2 py-0.5 rounded-full">Entregue</span>;
                                                        if (diffDays < 0) return <span className="text-[10px] text-red-500 font-bold uppercase tracking-wide bg-red-500/10 px-2 py-0.5 rounded-full">Atrasado ({Math.abs(diffDays)}d)</span>;
                                                        if (diffDays <= 2) return <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wide bg-yellow-500/10 px-2 py-0.5 rounded-full">{diffDays === 0 ? 'Expira Hoje' : 'Expira em breve'}</span>;
                                                        return <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide bg-zinc-700/50 px-2 py-0.5 rounded-full">No Prazo</span>;
                                                    })()}
                                                </p>
                                                <div className="relative">
                                                    <input ref={deadlineRef} defaultValue={initialData?.deadline ? initialData.deadline.split('T')[0] : ''} onChange={(e) => autoSaveField('deadline', e.target.value)} className="w-full h-11 rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 px-4 text-sm placeholder:text-zinc-500 focus:border-primary [color-scheme:dark]" type="date" />
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    // Create Mode Form (Single Column)
                    <div className="flex flex-col gap-8">
                        {/* Basic Info */}
                        <div className="mb-0">
                            <h3 className="text-white text-xl font-bold mb-5 flex items-center gap-2">
                                <Info className="text-primary" size={20} />
                                Informações Básicas
                            </h3>
                            <div className="grid grid-cols-1 gap-6">
                                <label className="flex flex-col w-full">
                                    <p className="text-white text-sm font-medium leading-normal pb-2">Título da Demanda <span className="text-red-400">*</span></p>
                                    <input ref={titleRef} defaultValue={initialData?.title} className="w-full h-12 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 placeholder:text-zinc-500 px-4 text-base transition-all focus:border-primary" placeholder="ex: Campanha Black Friday 2024" />
                                </label>
                                <label className="flex flex-col w-full">
                                    <p className="text-white text-sm font-medium leading-normal pb-2">Link de Referência</p>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                                            <LinkIcon size={20} />
                                        </span>
                                        <input ref={refLinkRef} defaultValue={initialData?.reference_link} className="w-full h-12 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 placeholder:text-zinc-500 pl-11 pr-4 text-base transition-all focus:border-primary" placeholder="Cole a URL aqui..." />
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Classification */}
                        <div className="mb-0">
                            <h3 className="text-white text-xl font-bold mb-5 flex items-center gap-2">
                                <Grid className="text-primary" size={20} />
                                Classificação
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="flex flex-col w-full">
                                    <p className="text-white text-sm font-medium leading-normal pb-2">Prioridade</p>
                                    <div className="relative">
                                        <select ref={priorityRef} defaultValue={initialData?.priority || "Média"} className="w-full h-12 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 px-4 text-base appearance-none cursor-pointer focus:border-primary">
                                            <option value="Média">Média</option>
                                            <option value="Alta">Alta</option>
                                            <option value="Baixa">Baixa</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
                                        <Flag className="absolute right-12 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
                                    </div>
                                </label>
                                <label className="flex flex-col w-full">
                                    <p className="text-white text-sm font-medium leading-normal pb-2">Designer Responsável</p>
                                    <div className="relative">
                                        <select ref={designerRef} defaultValue={initialData?.responsible_id || ""} className="w-full h-12 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 px-4 text-base appearance-none cursor-pointer focus:border-primary">
                                            <option disabled value="">Selecione o designer</option>
                                            {profiles.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
                                    </div>
                                </label>
                                <label className="flex flex-col w-full">
                                    <p className="text-white text-sm font-medium leading-normal pb-2">Tipo de Demanda <span className="text-red-400">*</span></p>
                                    <div className="relative">
                                        <select ref={typeRef} defaultValue={initialData?.type_id || ""} className="w-full h-12 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 px-4 text-base appearance-none cursor-pointer focus:border-primary">
                                            <option disabled value="">Selecione o tipo</option>
                                            {types.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
                                    </div>
                                </label>
                                <label className="flex flex-col w-full">
                                    <p className="text-white text-sm font-medium leading-normal pb-2">Origem</p>
                                    <div className="relative">
                                        <select ref={originRef} defaultValue={initialData?.origin_id || ""} className="w-full h-12 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 px-4 text-base appearance-none cursor-pointer focus:border-primary">
                                            <option disabled value="">Selecione a origem</option>
                                            {origins.map(o => (
                                                <option key={o.id} value={o.id}>{o.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Schedule */}
                        <div className="mb-0">
                            <h3 className="text-white text-xl font-bold mb-5 flex items-center gap-2">
                                <Calendar className="text-primary" size={20} />
                                Cronograma
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="flex flex-col w-full">
                                    <p className="text-white text-sm font-medium leading-normal pb-2">Data da Solicitação</p>
                                    <div className="relative">
                                        <input className="w-full h-12 rounded-[6px] text-zinc-400 bg-zinc-700/50 border border-zinc-600 px-4 text-base cursor-not-allowed opacity-70" disabled value={new Date().toLocaleDateString()} />
                                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                                    </div>
                                </label>
                                <label className="flex flex-col w-full">
                                    <p className="text-white text-sm font-medium leading-normal pb-2">Prazo <span className="text-red-400">*</span></p>
                                    <div className="relative">
                                        <input ref={deadlineRef} defaultValue={initialData?.deadline ? initialData.deadline.split('T')[0] : ''} className="w-full h-12 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 px-4 text-base placeholder:text-zinc-500 focus:border-primary [color-scheme:dark]" type="date" />
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-0">
                            <h3 className="text-white text-xl font-bold mb-5 flex items-center gap-2">
                                <FileText className="text-primary" size={20} />
                                Descrição
                            </h3>
                            <label className="flex flex-col w-full">
                                <p className="text-white text-sm font-medium leading-normal pb-2">Detalhes do briefing</p>
                                <div className="relative">
                                    <textarea ref={descriptionRef} defaultValue={initialData?.description} className="w-full min-h-[160px] rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 placeholder:text-zinc-500 p-4 text-base resize-y focus:border-primary" placeholder="Descreva os requisitos, copy e instruções específicas para esta demanda..."></textarea>
                                </div>
                            </label>
                        </div>

                        {/* Caption - Legenda */}
                        <div className="mb-0">
                            <h3 className="text-white text-xl font-bold mb-5 flex items-center gap-2">
                                <FileText className="text-primary" size={20} />
                                Legenda (Instagram)
                            </h3>
                            <label className="flex flex-col w-full">
                                <div className="relative flex flex-col">
                                    <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 border-b-0 rounded-t-lg p-2.5">
                                        <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                                            📝 COPY PARA LEGENDA
                                        </span>
                                    </div>
                                    <textarea ref={captionRef} defaultValue={initialData?.caption} className="w-full min-h-[200px] rounded-b-lg rounded-t-none text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 placeholder:text-zinc-500 p-4 text-base resize-y focus:border-primary" placeholder="Escreva a legenda aqui..."></textarea>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Footer Actions - Only for Create Mode (Edit saved in header) */}
                {!isEditMode && (
                    <div className="pt-6 border-t border-zinc-700 flex justify-end mt-8">
                        <button onClick={handleSubmit} disabled={saving} className="w-full md:w-auto flex items-center justify-center gap-2 h-14 px-10 rounded-full bg-primary text-zinc-900 hover:bg-[#a5b900] transition-all transform active:scale-95 shadow-[0_0_15px_rgba(188,210,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">
                            <span className="text-base font-bold">{saving ? 'Criando...' : 'Criar Demanda'}</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                )}

            </div >
        </div >
    );
};

export default CreateDemandForm;
