import React, { useState, useEffect } from 'react';
import { Shield, Loader2, Check } from 'lucide-react';
import { fetchTable, upsertRecord } from '../../lib/api';

const PermissionSettings = () => {
    // ... items ...
    const roles = ['ADMIN', 'GERENTE', 'DESIGNER', 'Visualizador'];
    // ... modules ... (keep logic)
    const modules = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'demands', label: 'Demandas' },
        { id: 'team', label: 'Equipe' },
        { id: 'reports', label: 'Relatórios' },
        { id: 'registers', label: 'Cadastros' },
        { id: 'config', label: 'Configurações' },
    ];

    // Initial State
    const [permissions, setPermissions] = useState<Record<string, Record<string, { view: boolean, edit: boolean, delete: boolean }>>>({});
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Fetch Data
    useEffect(() => {
        const loadPermissions = async () => {
            // ... (keep fetch logic) ...
            const data = await fetchTable('permissions');
            const initialPerms: any = {};
            roles.forEach(role => {
                initialPerms[role] = {};
                modules.forEach(mod => {
                    initialPerms[role][mod.id] = { view: false, edit: false, delete: false };
                });
            });

            if (data) {
                data.forEach((p: any) => {
                    if (initialPerms[p.role] && initialPerms[p.role][p.module]) {
                        initialPerms[p.role][p.module] = {
                            view: p.view, edit: p.edit, delete: p.delete
                        };
                    }
                });
            }
            modules.forEach(mod => {
                initialPerms['ADMIN'][mod.id] = { view: true, edit: true, delete: true };
            });
            setPermissions(initialPerms);
            setLoading(false);
        };
        loadPermissions();
    }, []);

    const handleToggle = async (role: string, moduleId: string, type: 'view' | 'edit' | 'delete') => {
        setSaveStatus('saving');
        // ... (keep logic) ...
        let newPerms = { ...permissions };
        const current = newPerms[role][moduleId];
        let updatedEntry = { ...current };

        if (type === 'view') {
            const newValue = !current.view;
            updatedEntry = { view: newValue, edit: newValue ? current.edit : false, delete: newValue ? current.delete : false };
        } else if (type === 'edit') {
            const newValue = !current.edit;
            updatedEntry = { view: newValue ? true : current.view, edit: newValue, delete: newValue ? current.delete : false };
        } else if (type === 'delete') {
            const newValue = !current.delete;
            updatedEntry = { view: newValue ? true : current.view, edit: newValue ? true : current.edit, delete: newValue };
        }

        newPerms[role][moduleId] = updatedEntry;
        setPermissions(newPerms);

        try {
            await upsertRecord('permissions', {
                role,
                module: moduleId,
                ...updatedEntry
            }, 'role,module');
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error('Failed to save permission:', error);
            setSaveStatus('idle'); // or error
        }
    };

    if (loading) return <div className="text-white text-center p-8">Carregando permissões...</div>;

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#23272f] rounded-xl border border-zinc-700/50 shadow-xl overflow-hidden p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Matriz de Permissões</h3>
                            <p className="text-zinc-400 text-sm">Defina o nível de acesso para cada cargo do sistema.</p>
                        </div>
                    </div>

                    {/* Save Status Indicator */}
                    <div className="flex items-center gap-2 h-8">
                        {saveStatus === 'saving' && (
                            <span className="flex items-center gap-2 text-zinc-400 text-xs animate-pulse bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-700">
                                <Loader2 size={12} className="animate-spin" />
                                Salvando...
                            </span>
                        )}
                        {saveStatus === 'saved' && (
                            <span className="flex items-center gap-2 text-green-400 text-xs bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20 animate-in fade-in zoom-in">
                                <Check size={12} />
                                Salvo
                            </span>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="p-4 text-left text-zinc-500 font-medium border-b border-zinc-700 w-48">Cargo</th>
                                {modules.map(mod => (
                                    <th key={mod.id} className="p-4 text-center text-zinc-300 font-medium border-b border-zinc-700 border-l border-zinc-800">
                                        {mod.label}
                                    </th>
                                ))}
                            </tr>
                            <tr className="text-xs text-zinc-500">
                                <th className="border-b border-zinc-700"></th>
                                {modules.map(mod => (
                                    <th key={mod.id} className="p-2 border-b border-zinc-700 border-l border-zinc-800">
                                        <div className="flex items-center justify-center gap-4">
                                            <span className="text-center w-9" title="Visualizar">Ver</span>
                                            <span className="text-center w-9" title="Editar">Gerir</span>
                                            <span className="text-center w-9" title="Excluir">Excluir</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((role) => (
                                <tr key={role} className="hover:bg-zinc-800/30 transition-colors">
                                    <td className="p-4 text-white font-medium border-b border-zinc-800">{role}</td>
                                    {modules.map(mod => {
                                        const perm = permissions[role]?.[mod.id] || { view: false, edit: false, delete: false };
                                        return (
                                            <td key={mod.id} className="p-4 border-b border-zinc-800 border-l border-zinc-800">
                                                <div className="flex items-center justify-center gap-4">
                                                    {/* View Checkbox */}
                                                    <label htmlFor={`${role}-${mod.id}-view`} className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            id={`${role}-${mod.id}-view`}
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={perm.view}
                                                            onChange={() => handleToggle(role, mod.id, 'view')}
                                                            disabled={role === 'ADMIN'} // Admin always full access
                                                        />
                                                        <div className={`w-9 h-5 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${role === 'ADMIN' ? 'opacity-50 cursor-not-allowed bg-green-500' : 'bg-zinc-700 peer-checked:bg-green-500'}`}></div>
                                                    </label>

                                                    {/* Edit Checkbox */}
                                                    <label htmlFor={`${role}-${mod.id}-edit`} className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            id={`${role}-${mod.id}-edit`}
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={perm.edit}
                                                            onChange={() => handleToggle(role, mod.id, 'edit')}
                                                            disabled={role === 'ADMIN'}
                                                        />
                                                        <div className={`w-9 h-5 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${role === 'ADMIN' ? 'opacity-50 cursor-not-allowed bg-indigo-500' : 'bg-zinc-700 peer-checked:bg-indigo-500'}`}></div>
                                                    </label>

                                                    {/* Delete Checkbox */}
                                                    <label htmlFor={`${role}-${mod.id}-delete`} className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            id={`${role}-${mod.id}-delete`}
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={perm.delete}
                                                            onChange={() => handleToggle(role, mod.id, 'delete')}
                                                            disabled={role === 'ADMIN'}
                                                        />
                                                        <div className={`w-9 h-5 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${role === 'ADMIN' ? 'opacity-50 cursor-not-allowed bg-red-500' : 'bg-zinc-700 peer-checked:bg-red-500'}`}></div>
                                                    </label>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-zinc-900/50 p-4 rounded-lg mt-6 border border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center text-sm">
                    <div className="flex gap-6 text-zinc-400">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            <span>Ver: Visualizar</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                            <span>Gerir: Criar/Editar</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                            <span>Excluir: Deletar registros</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PermissionSettings;
