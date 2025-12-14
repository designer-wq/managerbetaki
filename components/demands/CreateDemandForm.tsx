import React, { useState, useEffect, useRef } from 'react';
import { Info, Grid, Calendar, FileText, Lock, ChevronDown, Link as LinkIcon, Bold, Italic, List, Image as ImageIcon, ArrowRight, Clock, MessageSquare, History, ExternalLink, Send, Flag } from 'lucide-react';
import { fetchTable, createRecord, updateRecord, fetchComments, fetchLogs, upsertRecord } from '../../lib/api';
import { useToast } from '../../components/ui/ToastContext';
import { useDemandTimer } from '../../hooks/useDemandTimer';

interface CreateDemandFormProps {
    onCancel?: () => void;
    onSuccess?: () => void;
    initialData?: any;
}

interface CustomStatus {
    id: string;
    name: string;
    color: string;
}

const CreateDemandForm: React.FC<CreateDemandFormProps> = ({
    initialData = null,
    onCancel,
    onSuccess,
    currentUser: propCurrentUser // Rename to avoid conflict with state
}) => {
    const { addToast } = useToast();
    const isEditMode = !!initialData;
    const [currentUser, setCurrentUser] = useState<any>(propCurrentUser); // Initialize with prop

    // Data State
    const [origins, setOrigins] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<CustomStatus[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    // Load User
    useEffect(() => {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            setCurrentUser(JSON.parse(stored));
        }
    }, []);

    // Fetch Options & Data
    useEffect(() => {
        const loadOptions = async () => {
            const [o, t, s, p] = await Promise.all([
                fetchTable('origins'),
                fetchTable('demand_types'),
                fetchTable('statuses'),
                fetchTable('profiles')
            ]);
            setOrigins(o || []);
            setTypes(t || []);
            setStatuses(s || []);
            setProfiles(p || []);

            // Set default status if new
            if (!initialData && s && s.length > 0) {
                const defaultStatus = s.find((st: any) => st.order === 1) || s[0];
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

    const handleStatusChange = async (newStatusId: string) => {
        const oldStatusId = statusId;
        setStatusId(newStatusId); // Update local generic status state

        // Only apply persistent timer logic if in Edit Mode
        if (!initialData?.id) return;

        const newStatusObj = statuses.find(s => s.id === newStatusId);
        const oldStatusObj = statuses.find(s => s.id === oldStatusId);

        const isNewProduction = newStatusObj?.name.toLowerCase().includes('produção');
        const isOldProduction = oldStatusObj?.name.toLowerCase().includes('produção');

        let updates: any = {};
        let newTimerState = { ...timerState };

        if (!isOldProduction && isNewProduction) {
            // Started Production
            const now = new Date().toISOString();
            updates = { production_started_at: now };
            newTimerState.production_started_at = now;
        }
        else if (isOldProduction && !isNewProduction) {
            // Stopped Production
            if (timerState.production_started_at) {
                const start = new Date(timerState.production_started_at).getTime();
                const now = new Date().getTime();
                const sessionSeconds = Math.max(0, Math.floor((now - start) / 1000));

                updates = {
                    production_started_at: null,
                    accumulated_time: (timerState.accumulated_time || 0) + sessionSeconds
                };

                newTimerState.production_started_at = null;
                newTimerState.accumulated_time = updates.accumulated_time;
            }
        }

        // If there are timer updates, save immediately
        if (Object.keys(updates).length > 0) {
            await updateRecord('demands', initialData.id, updates);
            setTimerState(newTimerState);
            // Optionally notify user nicely? No, silent is better for "auto-save" feel.
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
        if (!titleRef.current?.value || !typeRef.current?.value || !deadlineRef.current?.value) {
            alert('Por favor, preencha os campos obrigatórios (Título, Tipo, Prazo).');
            return;
        }

        // Use current timer state for submission
        const demandData = {
            title: titleRef.current.value,
            reference_link: refLinkRef.current?.value || '',
            drive_link: driveLink,
            priority: priorityRef.current?.value || 'Média',
            origin_id: originRef.current?.value || null,
            type_id: typeRef.current.value,
            status_id: statusId,
            responsible_id: designerRef.current?.value || null,
            deadline: deadlineRef.current.value,
            description: descriptionRef.current?.value || '',
            goal: '',
            production_started_at: timerState.production_started_at,
            accumulated_time: timerState.accumulated_time
        };

        try {
            const userId = currentUser ? currentUser.id : undefined;
            if (isEditMode) {
                await updateRecord('demands', initialData.id, demandData, userId);
                addToast('Demanda atualizada com sucesso!', 'success');
            } else {
                await createRecord('demands', demandData, userId);
                addToast('Demanda criada com sucesso!', 'success');
            }
            if (onSuccess) onSuccess();
            if (onCancel) onCancel();
        } catch (error: any) {
            console.error('Error saving demand:', error);
            addToast(`Erro ao salvar demanda: ${error.message || 'Erro desconhecido'} `, 'error');
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
                        <div className="mb-10 w-full">
                            <div className={`rounded - xl px - 8 py - 5 border ${getCurrentStatusColor()} bg - zinc - 900 / 50 flex flex - col md: flex - row items - center justify - between gap - 4 w - full transition - colors`}>

                                {/* Left: Status Label */}
                                <div className="flex-1 flex justify-start">
                                    <div className={`px - 4 py - 1.5 rounded - full font - bold text - sm tracking - wide uppercase border ${getCurrentStatusColor()} shadow - sm bg - zinc - 900 / 50 text - white`}>
                                        {getCurrentStatusLabel()}
                                    </div>
                                </div>

                                {/* Center: Timer */}
                                <div className="flex-1 flex justify-center">
                                    {isRunning ? (
                                        <div className="flex items-center gap-3 text-primary font-mono text-4xl font-bold tracking-wider">
                                            <Clock size={32} className="animate-pulse" />
                                            {timerDisplay}
                                        </div>
                                    ) : (
                                        <span className="text-zinc-500 font-mono text-2xl">{timerDisplay}</span>
                                    )}
                                </div>

                                {/* Right: Action Dropdown */}
                                <div className="flex-1 flex justify-end">
                                    <div className="relative w-full max-w-[200px]">
                                        <select
                                            value={statusId}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                            disabled={!initialData?.id && statuses.length === 0}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        >
                                            <option value="" disabled>Selecione um status</option>
                                            {statuses.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* LEFT COLUMN - Main Content */}
                            <div className="flex-1 flex flex-col gap-8">

                                {/* Basic Info */}
                                <div>
                                    <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                        <Info className="text-primary" size={20} />
                                        Informações Básicas
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <label className="flex flex-col w-full">
                                            <p className="text-white text-sm font-medium leading-normal pb-2">Título da Demanda <span className="text-red-400">*</span></p>
                                            <input ref={titleRef} defaultValue={initialData?.title} className="w-full h-11 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 placeholder:text-zinc-500 px-4 text-sm transition-all focus:border-primary" placeholder="ex: Campanha Black Friday 2024" />
                                        </label>
                                        <label className="flex flex-col w-full">
                                            <div className="flex items-center justify-between pb-2">
                                                <p className="text-white text-sm font-medium leading-normal">Link de Referência</p>
                                                {initialData?.reference_link && (
                                                    <a href={initialData.reference_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                                        <span>Abrir Link</span>
                                                        <ExternalLink size={12} />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                                                    <LinkIcon size={18} />
                                                </span>
                                                <input ref={refLinkRef} defaultValue={initialData?.reference_link} className="w-full h-11 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 placeholder:text-zinc-500 pl-10 pr-4 text-sm transition-all focus:border-primary" placeholder="Cole a URL aqui..." />
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Classification */}
                                <div>
                                    <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                        <Grid className="text-primary" size={20} />
                                        Classificação
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <label className="flex flex-col w-full">
                                            <p className="text-white text-sm font-medium leading-normal pb-2">Prioridade</p>
                                            <div className="relative">
                                                <select ref={priorityRef} defaultValue={initialData?.priority || "Média"} className="w-full h-11 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 px-4 text-sm appearance-none cursor-pointer focus:border-primary">
                                                    <option value="Alta">Alta</option>
                                                    <option value="Média">Média</option>
                                                    <option value="Baixa">Baixa</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                                <Flag className="absolute right-10 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                            </div>
                                        </label>
                                        <label className="flex flex-col w-full">
                                            <p className="text-white text-sm font-medium leading-normal pb-2">Designer Responsável</p>
                                            <div className="relative">
                                                <select ref={designerRef} defaultValue={initialData?.responsible_id || ""} className="w-full h-11 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 px-4 text-sm appearance-none cursor-pointer focus:border-primary">
                                                    <option disabled value="">Selecione o designer</option>
                                                    {profiles.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                            </div>
                                        </label>
                                        <label className="flex flex-col w-full">
                                            <p className="text-white text-sm font-medium leading-normal pb-2">Tipo de Demanda <span className="text-red-400">*</span></p>
                                            <div className="relative">
                                                <select ref={typeRef} defaultValue={initialData?.type_id || ""} className="w-full h-11 rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 px-4 text-sm appearance-none cursor-pointer focus:border-primary">
                                                    <option disabled value="">Selecione o tipo</option>
                                                    {types.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                            </div>
                                        </label>
                                        <label className="flex flex-col w-full md:col-span-2">
                                            <p className="text-white text-sm font-medium leading-normal pb-2">Origem</p>
                                            <div className="relative">
                                                <select ref={originRef} defaultValue={initialData?.origin_id || ""} className="w-full h-11 rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 px-4 text-sm appearance-none cursor-pointer focus:border-primary">
                                                    <option disabled value="">Selecione a origem</option>
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
                                <div>
                                    <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                        <Calendar className="text-primary" size={20} />
                                        Cronograma
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                    const deadline = new Date(initialData.deadline);
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
                                                <input ref={deadlineRef} defaultValue={initialData?.deadline ? initialData.deadline.split('T')[0] : ''} className="w-full h-11 rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 px-4 text-sm placeholder:text-zinc-500 focus:border-primary [color-scheme:dark]" type="date" />
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                        <FileText className="text-primary" size={20} />
                                        Descrição
                                    </h3>
                                    <label className="flex flex-col w-full">
                                        <p className="text-white text-sm font-medium leading-normal pb-2">Detalhes do briefing</p>
                                        <div className="relative">
                                            <textarea ref={descriptionRef} defaultValue={initialData?.description} className="w-full min-h-[160px] rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900 placeholder:text-zinc-500 p-4 text-sm resize-y focus:border-primary" placeholder="Descreva os requisitos, copy e instruções específicas para esta demanda..."></textarea>
                                        </div>
                                    </label>
                                </div>

                            </div>

                            {/* RIGHT COLUMN - Meta & Actions */}
                            <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-6">

                                {/* Comments */}
                                <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-700/50 flex flex-col h-full max-h-[500px]">
                                    <h3 className="text-white text-base font-bold mb-4 flex items-center gap-2">
                                        <MessageSquare size={18} className="text-zinc-400" />
                                        Comentários
                                    </h3>
                                    <div className="flex flex-col gap-3 mb-4 flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[150px]">
                                        {comments.length === 0 ? (
                                            <div className="text-zinc-500 text-sm text-center py-4">
                                                Nenhum comentário ainda.
                                            </div>
                                        ) : (
                                            comments.map(comment => (
                                                <div key={comment.id} className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold text-white">{comment.profiles?.name || "Usuário"}</span>
                                                        <span className="text-[10px] text-zinc-500">{new Date(comment.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.content}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="relative mt-auto">
                                        <div className="flex gap-2 items-end">
                                            <textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                className="w-full h-10 min-h-[40px] max-h-[100px] rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:border-primary resize-y placeholder:text-zinc-600 custom-scrollbar leading-tight"
                                                placeholder="Escreva um comentário..."
                                                style={{ height: '42px' }}
                                            ></textarea>
                                            <button
                                                onClick={handleSendComment}
                                                disabled={sendingComment || !newComment.trim()}
                                                className="h-[42px] w-[42px] flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-zinc-900 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Drive Link */}
                                <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-700/50">
                                    <h3 className="text-white text-base font-bold mb-4 flex items-center gap-2 justify-between">
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-100">
                                                <path d="M12.01 1.485c2.082 0 3.754.02 3.743.047l5.363 9.308-5.36 9.3c-.02.434-.055.83-.17 1.35H5.438c-1.353 0-2.455-1.1-2.455-2.452s1.102-2.455 2.455-2.455h3.19l-3.2-5.54a2.46 2.46 0 0 1 .897-3.352c.28-.162.66-.282.97-.282h4.715zM7.22 8.718l-1.95 3.37a.65.65 0 0 0 .235.882c.073.043.175.074.256.074h2.923c.36 0 .65-.29.65-.648 0-.36-.29-.65-.65-.65H6.556l1.52-2.63c.18-.31.077-.707-.233-.886a.65.65 0 0 0-.623-.002zM19.16 11.23l-1.948 3.376-1.55 2.686c-.18.312-.576.417-.89.237a.648.648 0 0 1-.235-.887l3.73-6.463c.18-.312.577-.417.89-.236a.65.65 0 0 1 .235.885l-.234.403zM13.57 6.06l-1.948 3.376c-.18.313-.577.418-.89.237a.65.65 0 0 1-.235-.887l1.95-3.373a.65.65 0 0 1 .887-.237c.313.18.418.576.237.887z" fillRule="evenodd" />
                                                <path d="M8.706 1.504L3.89 9.87c-.894 1.547-2.65 2.22-4.195 1.33C-1.85 10.306-2.522 8.55-1.63 7.004l4.82-8.368c.89-1.546 2.64-2.22 4.185-1.328 1.545.892 2.22 2.65 1.33 4.196zm12.35 15.69l-4.815 8.368c-.892 1.547-2.648 2.22-4.193 1.328-1.545-.89-2.218-2.648-1.327-4.193l4.817-8.37c.892-1.545 2.65-2.218 4.194-1.326.793.456 1.31 1.252 1.326 2.162.015.908-.485 1.713-1.285 2.175-.002.155.002.317.02.476.12.92.54 1.765 1.264 2.38z" fill="none" />
                                                <path d="M12.01 1.485c-2.082 0-3.755.02-3.744.047L2.903 10.84H5.44c1.353 0 2.455 1.1 2.455 2.452s-1.102 2.455 2.455 2.455H2.25l3.2 5.54a2.46 2.46 0 0 0 .897 3.352c.28.162.66.282.97.282h14.715c2.082 0 3.754-.02 3.743-.047L17.412 10.84h-2.536c-1.353 0-2.455-1.1-2.455-2.452s1.102-2.455 2.455-2.455h3.19l-3.2-5.54a2.46 2.46 0 0 0-.897-3.352 2.46 2.46 0 0 0-.97-.282H12.01zm-3.303 6.91l1.95-3.376c.18-.313.577-.418.89-.237.312.18.417.576.236.887l-1.95 3.373a.65.65 0 0 1-.887.237.648.648 0 0 1-.237-.887zM8.36 17.57l1.95-3.375a.65.65 0 0 1 .89-.236c.312.18.417.575.236.886l-1.95 3.377a.648.648 0 0 1-.887.236.65.65 0 0 1-.237-.887zm10.8-6.34l1.948 3.376c.18.312.077.708-.234.887a.648.648 0 0 1-.89-.237l-1.95-3.373a.65.65 0 0 1 .235-.887c.074.043.176.074.257.074h.634z" fill="currentColor" />
                                            </svg>
                                            Arquivo Drive
                                        </div>
                                        {driveLink && (
                                            <a href={driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                                <span>Abrir</span>
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </h3>
                                    <div className="flex gap-2">
                                        <input
                                            value={driveLink}
                                            onChange={(e) => setDriveLink(e.target.value)}
                                            className="flex-1 h-11 rounded-lg text-white text-sm focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-800 placeholder:text-zinc-600 px-3 min-w-0"
                                            placeholder="Cole o link..."
                                        />
                                        {driveLink && (
                                            <a href={driveLink} target="_blank" rel="noreferrer" className="flex items-center justify-center h-11 w-11 shrink-0 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white transition-colors">
                                                <ExternalLink size={18} />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-700/50">
                                    <h3 className="text-white text-base font-bold mb-4 flex items-center gap-2">
                                        <History size={18} className="text-zinc-400" />
                                        Linha do Tempo
                                    </h3>
                                    <div className="flex flex-col gap-4 pl-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {logs.length === 0 ? (
                                            <div className="text-zinc-500 text-sm">Sem histórico.</div>
                                        ) : (
                                            logs.map((item) => (
                                                <div key={item.id} className="relative pl-4 border-l border-zinc-700 last:border-0 pb-1">
                                                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-600 ring-4 ring-zinc-900"></div>
                                                    <p className="text-zinc-300 text-sm leading-tight">
                                                        {item.action === 'CREATE' ? 'Demanda Criada' :
                                                            item.action === 'UPDATE' ? 'Demanda Atualizada' : item.action}
                                                    </p>
                                                    <p className="text-zinc-500 text-xs mt-1">
                                                        {item.profiles?.name || 'Sistema'} • {new Date(item.created_at).toLocaleString()}
                                                    </p>
                                                    {item.details && item.details.status_id && (
                                                        <p className="text-zinc-500 text-[10px] mt-0.5">Status alterado</p>
                                                    )}
                                                </div>
                                            ))
                                        )}
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
                                    <input ref={titleRef} className="w-full h-12 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 placeholder:text-zinc-500 px-4 text-base transition-all focus:border-primary" placeholder="ex: Campanha Black Friday 2024" />
                                </label>
                                <label className="flex flex-col w-full">
                                    <p className="text-white text-sm font-medium leading-normal pb-2">Link de Referência</p>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                                            <LinkIcon size={20} />
                                        </span>
                                        <input ref={refLinkRef} className="w-full h-12 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 placeholder:text-zinc-500 pl-11 pr-4 text-base transition-all focus:border-primary" placeholder="Cole a URL aqui..." />
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
                                        <select ref={priorityRef} className="w-full h-12 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 px-4 text-base appearance-none cursor-pointer focus:border-primary">
                                            <option selected value="Média">Média</option>
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
                                        <select ref={designerRef} className="w-full h-12 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 px-4 text-base appearance-none cursor-pointer focus:border-primary">
                                            <option disabled selected value="">Selecione o designer</option>
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
                                        <select ref={typeRef} className="w-full h-12 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 px-4 text-base appearance-none cursor-pointer focus:border-primary">
                                            <option disabled selected value="">Selecione o tipo</option>
                                            {types.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
                                    </div>
                                </label>
                                <label className="flex flex-col w-full md:col-span-2">
                                    <p className="text-white text-sm font-medium leading-normal pb-2">Origem</p>
                                    <div className="relative">
                                        <select ref={originRef} className="w-full h-12 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 px-4 text-base appearance-none cursor-pointer focus:border-primary">
                                            <option disabled selected value="">Selecione a origem</option>
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
                                        <input ref={deadlineRef} className="w-full h-12 rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 px-4 text-base placeholder:text-zinc-500 focus:border-primary [color-scheme:dark]" type="date" />
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
                                    <textarea ref={descriptionRef} className="w-full min-h-[160px] rounded-[6px] text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-zinc-600 bg-zinc-900/50 placeholder:text-zinc-500 p-4 text-base resize-y focus:border-primary" placeholder="Descreva os requisitos, copy e instruções específicas para esta demanda..."></textarea>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="pt-6 border-t border-zinc-700 flex flex-col md:flex-row justify-end items-center gap-4 mt-8">
                    <button
                        onClick={onCancel}
                        className="flex-1 md:flex-none flex items-center justify-center h-12 px-6 rounded-full bg-zinc-700 text-white text-base font-bold hover:bg-zinc-600 transition-colors w-full md:w-auto"
                    >
                        {isEditMode ? 'Fechar' : 'Cancelar'}
                    </button>

                    <button onClick={handleSubmit} className="w-full md:w-auto flex items-center justify-center gap-2 h-14 px-10 rounded-full bg-primary text-white hover:bg-[#a5b900] transition-all transform active:scale-95 shadow-[0_0_15px_rgba(188,210,0,0.3)]">
                        <span className="text-base font-bold">{isEditMode ? 'Salvar Alterações' : 'Criar Demanda'}</span>
                        <ArrowRight size={20} />
                    </button>
                </div>

            </div >
        </div >
    );
};

export default CreateDemandForm;
