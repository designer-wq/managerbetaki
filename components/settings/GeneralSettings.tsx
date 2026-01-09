import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Pencil, Check, X, Upload, GripVertical } from 'lucide-react';
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

interface GeneralSettingsProps {
    filterSection?: 'origins' | 'types' | 'statuses' | 'jobs' | 'visual';
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ filterSection = 'origins' }) => {
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

    // --- App Config State ---
    const [appLogo, setAppLogo] = useState('');
    const [isSavingLogo, setIsSavingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

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
            alert('Erro ao criar origem.');
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
            alert('Erro ao criar tipo.');
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
            alert('Erro ao criar status.');
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

    // --- Edit Handlers ---
    const startEdit = (item: any, type: 'origin' | 'type' | 'status' | 'job_title') => {
        setEditingId(item.id);
        setEditingType(type);
        setEditValue(item.name);
        setEditColor(item.color || '');
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

    // --- Logo Handlers ---
    const saveLogo = async (url: string) => {
        setIsSavingLogo(true);
        try {
            const existing = await fetchTable('app_config');
            const logoEntry = existing?.find((c: any) => c.key === 'app_logo');

            if (logoEntry) {
                await updateRecord('app_config', logoEntry.id, { value: url });
            } else {
                await createRecord('app_config', { key: 'app_logo', value: url });
            }
            alert('Logo atualizado com sucesso!');
        } catch (error: any) {
            console.error('Error saving logo:', error);
            alert(`Erro ao salvar logo: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsSavingLogo(false);
        }
    };

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

    const colorOptions = [
        { color: 'bg-zinc-500', label: 'Cinza' },
        { color: 'bg-red-500', label: 'Vermelho' },
        { color: 'bg-orange-500', label: 'Laranja' },
        { color: 'bg-yellow-500', label: 'Amarelo' },
        { color: 'bg-green-500', label: 'Verde' },
        { color: 'bg-blue-500', label: 'Azul' },
        { color: 'bg-indigo-500', label: 'Índigo' },
        { color: 'bg-purple-500', label: 'Roxo' },
        { color: 'bg-pink-500', label: 'Rosa' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-zinc-800 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    // --- Render Item Component ---
    const renderItem = (
        item: { id: string; name: string; color?: string },
        type: 'origin' | 'type' | 'status' | 'job_title',
        onDelete: (id: string) => void
    ) => {
        const isEditing = editingId === item.id && editingType === type;

        if (isEditing) {
            return (
                <div key={item.id} className="bg-zinc-800/50 rounded-xl p-4 border border-primary/50">
                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            autoFocus
                        />
                        {type === 'status' && (
                            <div className="flex gap-2 flex-wrap">
                                {colorOptions.map(({ color }) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setEditColor(color)}
                                        className={`w-8 h-8 rounded-lg ${color} ${editColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-800' : 'opacity-70 hover:opacity-100'} transition-all`}
                                    />
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2 justify-end">
                            <button onClick={cancelEdit} className="px-4 py-2 rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 text-sm font-medium transition-colors">
                                Cancelar
                            </button>
                            <button onClick={saveEdit} className="px-4 py-2 rounded-lg bg-primary text-black text-sm font-bold hover:bg-primary/90 transition-colors">
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div key={item.id} className="group flex items-center gap-3 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 transition-all">
                {type === 'status' && item.color && (
                    <div className={`w-4 h-4 rounded-full ${item.color} shrink-0`} />
                )}
                <span className="text-white font-medium flex-1">{item.name}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                        onClick={() => startEdit(item, type)}
                        className="p-2 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Editar"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Excluir"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        );
    };

    // --- Render Add Form ---
    const renderAddForm = (
        value: string,
        setValue: (v: string) => void,
        onSubmit: (e: React.FormEvent) => void,
        placeholder: string,
        showColorPicker?: boolean
    ) => (
        <form onSubmit={onSubmit} className="bg-zinc-900/30 rounded-xl p-4 border border-dashed border-zinc-700">
            <div className="flex flex-col gap-3">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                {showColorPicker && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-zinc-400">Cor:</span>
                        <div className="flex gap-2 flex-wrap">
                            {colorOptions.map(({ color }) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setNewStatusColor(color)}
                                    className={`w-7 h-7 rounded-lg ${color} ${newStatusColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'opacity-60 hover:opacity-100'} transition-all`}
                                />
                            ))}
                        </div>
                    </div>
                )}
                <button
                    type="submit"
                    className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    <span>Adicionar</span>
                </button>
            </div>
        </form>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Origins Section */}
            {filterSection === 'origins' && (
                <div className="space-y-4">
                    <div className="grid gap-3">
                        {origins.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500">
                                <p>Nenhuma origem cadastrada.</p>
                                <p className="text-sm mt-1">Adicione sua primeira origem abaixo.</p>
                            </div>
                        ) : (
                            origins.map(item => renderItem(item, 'origin', handleDeleteOrigin))
                        )}
                    </div>
                    <div className="mt-6">
                        {renderAddForm(newOrigin, setNewOrigin, handleAddOrigin, 'Nome da nova origem...')}
                    </div>
                </div>
            )}

            {/* Types Section */}
            {filterSection === 'types' && (
                <div className="space-y-4">
                    <div className="grid gap-3">
                        {demandTypes.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500">
                                <p>Nenhum tipo cadastrado.</p>
                                <p className="text-sm mt-1">Adicione seu primeiro tipo abaixo.</p>
                            </div>
                        ) : (
                            demandTypes.map(item => renderItem(item, 'type', handleDeleteType))
                        )}
                    </div>
                    <div className="mt-6">
                        {renderAddForm(newType, setNewType, handleAddType, 'Nome do novo tipo de demanda...')}
                    </div>
                </div>
            )}

            {/* Status Section */}
            {filterSection === 'statuses' && (
                <div className="space-y-4">
                    <div className="grid gap-3">
                        {statuses.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500">
                                <p>Nenhum status cadastrado.</p>
                                <p className="text-sm mt-1">Adicione seu primeiro status abaixo.</p>
                            </div>
                        ) : (
                            statuses.map(item => renderItem(item, 'status', handleDeleteStatus))
                        )}
                    </div>
                    <div className="mt-6">
                        {renderAddForm(newStatus, setNewStatus, handleAddStatus, 'Nome do novo status...', true)}
                    </div>
                </div>
            )}

            {/* Jobs Section */}
            {filterSection === 'jobs' && (
                <div className="space-y-4">
                    <div className="grid gap-3">
                        {jobTitles.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500">
                                <p>Nenhum cargo cadastrado.</p>
                                <p className="text-sm mt-1">Adicione seu primeiro cargo abaixo.</p>
                            </div>
                        ) : (
                            jobTitles.map(item => renderItem(item, 'job_title', handleDeleteJobTitle))
                        )}
                    </div>
                    <div className="mt-6">
                        {renderAddForm(newJobTitle, setNewJobTitle, handleAddJobTitle, 'Nome do novo cargo...')}
                    </div>
                </div>
            )}

            {/* Visual Identity Section */}
            {filterSection === 'visual' && (
                <div className="space-y-6">
                    <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
                        <h3 className="text-lg font-semibold text-white mb-4">Logo do Sistema</h3>
                        <div className="flex items-start gap-6">
                            <div
                                className="w-24 h-24 bg-zinc-800 rounded-2xl border-2 border-dashed border-zinc-600 bg-cover bg-center bg-no-repeat shrink-0 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-primary transition-colors"
                                style={{ backgroundImage: appLogo ? `url("${appLogo}")` : 'none' }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {!appLogo && <span className="text-sm text-zinc-500">Logo</span>}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                                    <Upload size={24} className="text-white" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <h4 className="text-white font-medium">Logo da Sidebar</h4>
                                    <p className="text-zinc-500 text-sm mt-1">
                                        Recomendado: 200x200 pixels (PNG ou SVG com fundo transparente).
                                    </p>
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    <Upload size={16} />
                                    {isUploading ? 'Enviando...' : 'Alterar Logo'}
                                </button>
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
            )}
        </div>
    );
};

export default GeneralSettings;
