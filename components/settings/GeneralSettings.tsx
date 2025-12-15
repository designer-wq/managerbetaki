import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Layers, Tag, CheckCircle, Pencil, Check, X, Briefcase, Upload } from 'lucide-react';
import { fetchTable, createRecord, updateRecord, deleteRecord } from '../../lib/api';
import { getSupabase } from '../../lib/supabase';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

// Interfaces matching DB Schema
interface Origin {
    id: string;
    name: string;
}

interface DemandType {
    id: string;
    name: string;
}

interface Status {
    id: string;
    name: string;
    color: string;
    order?: number;
}

interface JobTitle {
    id: string;
    name: string;
}



const GeneralSettings = () => {
    // --- Data State ---
    const [origins, setOrigins] = useState<Origin[]>([]);
    const [demandTypes, setDemandTypes] = useState<DemandType[]>([]);
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [loading, setLoading] = useState(true);

    // --- Inputs State ---
    const [newOrigin, setNewOrigin] = useState('');
    const [newType, setNewType] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [newStatusColor, setNewStatusColor] = useState('bg-zinc-500');
    const [newJobTitle, setNewJobTitle] = useState('');

    // --- Edit State ---
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [editColor, setEditColor] = useState('');
    const [editingType, setEditingType] = useState<'origin' | 'type' | 'status' | 'job_title' | null>(null);

    // --- Fetch Data ---
    const loadData = async () => {
        setLoading(true);
        const originsData = await fetchTable('origins');
        const typesData = await fetchTable('demand_types');
        const statusesData = await fetchTable('statuses');
        const jobTitlesData = await fetchTable('job_titles');
        const settingsData = await fetchTable('app_config');
        setOrigins(originsData || []);
        setDemandTypes(typesData || []);
        setStatuses(statusesData || []);
        setJobTitles(jobTitlesData || []);

        const logoConfig = settingsData?.find((c: any) => c.key === 'app_logo');
        if (logoConfig && logoConfig.value) {
            setAppLogo(logoConfig.value);
        }

        setLoading(false);
    };


    useEffect(() => {
        loadData();
    }, []);

    useRealtimeSubscription(['origins', 'demand_types', 'statuses', 'job_titles', 'app_config'], loadData);

    // --- Handlers ---
    const handleAddOrigin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOrigin.trim()) return;
        try {
            await createRecord('origins', { name: newOrigin });
            setNewOrigin('');
            loadData();
        } catch (error) {
            console.error('Error adding origin:', error);
            alert('Erro ao criar origem. Verifique se o script de correção do banco foi executado.');
        }
    };

    const handleDeleteOrigin = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta origem?')) {
            try {
                await deleteRecord('origins', id);
                loadData();
            } catch (error) {
                console.error('Error deleting origin:', error);
                alert('Erro ao excluir origem.');
            }
        }
    };

    const handleAddType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newType.trim()) return;
        try {
            await createRecord('demand_types', { name: newType });
            setNewType('');
            loadData();
        } catch (error) {
            console.error('Error adding type:', error);
            alert('Erro ao criar tipo. Execute o script de correção do banco.');
        }
    };

    const handleDeleteType = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este tipo?')) {
            await deleteRecord('demand_types', id);
            loadData();
        }
    };

    const handleAddStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStatus.trim()) return;
        try {
            await createRecord('statuses', { name: newStatus, color: newStatusColor });
            setNewStatus('');
            loadData();
        } catch (error) {
            console.error('Error adding status:', error);
            alert('Erro ao criar status. Execute o script de correção do banco.');
        }
    };

    const handleDeleteStatus = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este status?')) {
            await deleteRecord('statuses', id);
            loadData();
        }
    };

    const handleAddJobTitle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newJobTitle.trim()) return;
        await createRecord('job_titles', { name: newJobTitle });
        setNewJobTitle('');
        loadData();
    };

    const handleDeleteJobTitle = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este cargo?')) {
            await deleteRecord('job_titles', id);
            loadData();
        }
    };



    // --- App Config State ---
    const [appLogo, setAppLogo] = useState('');
    const [isSavingLogo, setIsSavingLogo] = useState(false);

    // --- Edit Handlers ---
    const startEdit = (item: any, type: 'origin' | 'type' | 'status' | 'job_title') => {
        setEditingId(item.id);
        setEditingType(type);
        setEditValue(item.name);
        setEditColor(item.color || '');
    };

    // --- Fetch Data ---


    const handleSaveLogo = async (e: React.FormEvent) => {
        e.preventDefault();
        saveLogo(appLogo);
    };

    const saveLogo = async (url: string) => {
        setIsSavingLogo(true);
        try {
            // Check if exists
            const existing = await fetchTable('app_config');
            const logoEntry = existing?.find((c: any) => c.key === 'app_logo');

            if (logoEntry) {
                await updateRecord('app_config', logoEntry.id, { value: url });
            } else {
                await createRecord('app_config', { key: 'app_logo', value: url });
            }
            // Update local state if needed, but usually we just alert
            alert('Logo atualizado com sucesso!');
        } catch (error: any) {
            console.error('Error saving logo:', error);
            alert(`Erro ao salvar logo: ${error.message || error.error_description || 'Erro desconhecido'}`);
        } finally {
            setIsSavingLogo(false);
        }
    };

    // --- File Upload ---
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const supabase = getSupabase();
        if (!supabase) {
            alert('Erro de conexão com Supabase');
            setIsUploading(false);
            return;
        }

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo-${Date.now()}.${fileExt}`;
            const { data, error } = await supabase.storage
                .from('app-assets')
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('app-assets')
                .getPublicUrl(fileName);

            setAppLogo(publicUrl);
            await saveLogo(publicUrl);

        } catch (error: any) {
            console.error('Error uploading file:', error);
            alert(`Erro ao fazer upload: ${error.message || 'Verifique as permissões do bucket'}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingType(null);
        setEditValue('');
        setEditColor('');
    };

    const saveEdit = async () => {
        if (!editingId || !editingType) return;

        if (editingType === 'origin') {
            await updateRecord('origins', editingId, { name: editValue });
        } else if (editingType === 'type') {
            await updateRecord('demand_types', editingId, { name: editValue });
        } else if (editingType === 'status') {
            await updateRecord('statuses', editingId, { name: editValue, color: editColor });
        } else if (editingType === 'job_title') {
            await updateRecord('job_titles', editingId, { name: editValue });
        }

        cancelEdit();
        loadData();
    };

    const colorOptions = [
        'bg-zinc-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500',
        'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'
    ];

    if (loading) {
        return <div className="text-white text-center p-8">Carregando dados...</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* App Identity Panel */}
            <div className="card-enterprise overflow-hidden flex flex-col">
                <div className="p-4 border-b border-zinc-700/50 bg-zinc-800/30 flex items-center gap-2">
                    <Tag className="text-zinc-400" size={20} />
                    <h3 className="font-semibold text-white">Identidade Visual</h3>
                </div>
                <div className="p-4 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-16 h-16 bg-zinc-800 rounded-full border border-zinc-700 bg-cover bg-center bg-no-repeat shrink-0 flex items-center justify-center overflow-hidden relative group cursor-pointer"
                            style={{ backgroundImage: appLogo ? `url("${appLogo}")` : 'none' }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {!appLogo && <span className="text-xs text-zinc-500">Logo</span>}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="flex-1 space-y-1">
                            <h4 className="text-sm font-medium text-zinc-200">Logo da Sidebar</h4>
                            <p className="text-xs text-zinc-500">
                                Recomendado: 200x200px (PNG ou SVG).<br />
                                Clique na imagem para alterar.
                            </p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/png,image/jpeg,image/svg+xml"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Origins Panel */}
            <div className="card-enterprise overflow-hidden flex flex-col">
                <div className="p-4 border-b border-zinc-700/50 bg-zinc-800/30 flex items-center gap-2">
                    <Layers className="text-zinc-400" size={20} />
                    <h3 className="font-semibold text-white">Origens</h3>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-4">
                    <form onSubmit={handleAddOrigin} className="flex gap-2">
                        <input
                            type="text"
                            value={newOrigin}
                            onChange={(e) => setNewOrigin(e.target.value)}
                            placeholder="Nova origem..."
                            className="flex-1 bg-zinc-900/50 border border-zinc-600 rounded-[6px] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button type="submit" className="p-2 bg-zinc-800 hover:bg-primary hover:text-white text-zinc-400 rounded-lg transition-colors">
                            <Plus size={20} />
                        </button>
                    </form>
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                        {origins.length === 0 && <span className="text-zinc-500 text-sm text-center py-4">Nenhuma origem cadastrada.</span>}
                        {origins.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-[6px] border border-zinc-700 group">
                                {editingId === item.id && editingType === 'origin' ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1 bg-[#23272f] border border-zinc-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-primary"
                                            autoFocus
                                        />
                                        <button onClick={saveEdit} className="text-green-500 hover:text-green-400"><Check size={16} /></button>
                                        <button onClick={cancelEdit} className="text-red-500 hover:text-red-400"><X size={16} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-zinc-300 text-sm">{item.name}</span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => startEdit(item, 'origin')} className="text-zinc-500 hover:text-blue-500">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteOrigin(item.id)} className="text-zinc-500 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Demand Types Panel */}
            <div className="card-enterprise overflow-hidden flex flex-col">
                <div className="p-4 border-b border-zinc-700/50 bg-zinc-800/30 flex items-center gap-2">
                    <Tag className="text-zinc-400" size={20} />
                    <h3 className="font-semibold text-white">Tipos de Demanda</h3>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-4">
                    <form onSubmit={handleAddType} className="flex gap-2">
                        <input
                            type="text"
                            value={newType}
                            onChange={(e) => setNewType(e.target.value)}
                            placeholder="Novo tipo..."
                            className="flex-1 bg-zinc-900/50 border border-zinc-600 rounded-[6px] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button type="submit" className="p-2 bg-zinc-800 hover:bg-primary hover:text-white text-zinc-400 rounded-lg transition-colors">
                            <Plus size={20} />
                        </button>
                    </form>
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                        {demandTypes.length === 0 && <span className="text-zinc-500 text-sm text-center py-4">Nenhum tipo cadastrado.</span>}
                        {demandTypes.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-[6px] border border-zinc-700 group">
                                {editingId === item.id && editingType === 'type' ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1 bg-zinc-900/50 border border-zinc-600 rounded-[6px] px-2 py-1 text-sm text-white focus:outline-none focus:border-primary"
                                            autoFocus
                                        />
                                        <button onClick={saveEdit} className="text-green-500 hover:text-green-400"><Check size={16} /></button>
                                        <button onClick={cancelEdit} className="text-red-500 hover:text-red-400"><X size={16} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-zinc-300 text-sm">{item.name}</span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => startEdit(item, 'type')} className="text-zinc-500 hover:text-blue-500">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteType(item.id)} className="text-zinc-500 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Panel */}
            <div className="card-enterprise overflow-hidden flex flex-col">
                <div className="p-4 border-b border-zinc-700/50 bg-zinc-800/30 flex items-center gap-2">
                    <CheckCircle className="text-zinc-400" size={20} />
                    <h3 className="font-semibold text-white">Status</h3>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-4">
                    <form onSubmit={handleAddStatus} className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                placeholder="Novo status..."
                                className="flex-1 bg-zinc-900/50 border border-zinc-600 rounded-[6px] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div className="flex gap-2 justify-between items-center">
                            <div className="flex gap-1.5 flex-wrap">
                                {colorOptions.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setNewStatusColor(color)}
                                        className={`w-6 h-6 rounded-full ${color} ${newStatusColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900/50' : 'opacity-70 hover:opacity-100'} transition-all`}
                                    />
                                ))}
                            </div>
                            <button type="submit" className="p-2 bg-zinc-800 hover:bg-primary hover:text-white text-zinc-400 rounded-lg transition-colors">
                                <Plus size={20} />
                            </button>
                        </div>
                    </form>
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                        {statuses.length === 0 && <span className="text-zinc-500 text-sm text-center py-4">Nenhum status cadastrado.</span>}
                        {statuses.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-[6px] border border-zinc-700 group">
                                {editingId === item.id && editingType === 'status' ? (
                                    <div className="flex flex-col gap-2 w-full">
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-full bg-zinc-900/50 border border-zinc-600 rounded-[6px] px-2 py-1 text-sm text-white focus:outline-none focus:border-primary"
                                            autoFocus
                                        />
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-1 flex-wrap">
                                                {colorOptions.map(color => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setEditColor(color)}
                                                        className={`w-4 h-4 rounded-full ${color} ${editColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900/50' : 'opacity-70 hover:opacity-100'}`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={saveEdit} className="text-green-500 hover:text-green-400"><Check size={16} /></button>
                                                <button onClick={cancelEdit} className="text-red-500 hover:text-red-400"><X size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                            <span className="text-zinc-300 text-sm">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => startEdit(item, 'status')} className="text-zinc-500 hover:text-blue-500">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteStatus(item.id)} className="text-zinc-500 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Job Titles Panel */}
            <div className="card-enterprise overflow-hidden flex flex-col">
                <div className="p-4 border-b border-zinc-700/50 bg-zinc-800/30 flex items-center gap-2">
                    <Briefcase className="text-zinc-400" size={20} />
                    <h3 className="font-semibold text-white">Cargos</h3>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-4">
                    <form onSubmit={handleAddJobTitle} className="flex gap-2">
                        <input
                            type="text"
                            value={newJobTitle}
                            onChange={(e) => setNewJobTitle(e.target.value)}
                            placeholder="Novo cargo..."
                            className="flex-1 bg-zinc-900/50 border border-zinc-600 rounded-[6px] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button type="submit" className="p-2 bg-zinc-800 hover:bg-primary hover:text-white text-zinc-400 rounded-lg transition-colors">
                            <Plus size={20} />
                        </button>
                    </form>
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                        {jobTitles.length === 0 && <span className="text-zinc-500 text-sm text-center py-4">Nenhum cargo cadastrado.</span>}
                        {jobTitles.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-[6px] border border-zinc-700 group">
                                {editingId === item.id && editingType === 'job_title' ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1 bg-zinc-900/50 border border-zinc-600 rounded-[6px] px-2 py-1 text-sm text-white focus:outline-none focus:border-primary"
                                            autoFocus
                                        />
                                        <button onClick={saveEdit} className="text-green-500 hover:text-green-400"><Check size={16} /></button>
                                        <button onClick={cancelEdit} className="text-red-500 hover:text-red-400"><X size={16} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-zinc-300 text-sm">{item.name}</span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => startEdit(item, 'job_title')} className="text-zinc-500 hover:text-blue-500">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteJobTitle(item.id)} className="text-zinc-500 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>



        </div>
    );
};

export default GeneralSettings;
