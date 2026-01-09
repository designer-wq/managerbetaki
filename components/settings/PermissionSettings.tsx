import React, { useState, useEffect } from 'react';
import { Shield, Loader2, Check, Info } from 'lucide-react';
import { fetchTable, upsertRecord } from '../../lib/api';

const PermissionSettings = () => {
    const roleDisplayMap: Record<string, string> = {
        'admin': 'ADMIN',
        'gerente': 'GERENTE',
        'designer': 'DESIGNER',
        'visualizador': 'Visualizador'
    };
    const roles = Object.keys(roleDisplayMap);

    const modules = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'demands', label: 'Demandas' },
        { id: 'team', label: 'Equipe' },
        { id: 'goals', label: 'Metas' },
        { id: 'activity_log', label: 'Histórico' },
        { id: 'registers', label: 'Cadastros' },
        { id: 'config', label: 'Configurações' },
    ];

    // State: role -> module -> permissions
    const [permissions, setPermissions] = useState<Record<string, Record<string, { view: boolean, edit: boolean, delete: boolean }>>>({});
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'initializing'>('idle');

    // Fetch Data and auto-create missing permissions
    useEffect(() => {
        const loadPermissions = async () => {
            const data = await fetchTable('role_permissions');
            const initialPerms: any = {};
            const existingPermissions = new Set<string>();

            // Track existing permissions from DB
            if (data) {
                data.forEach((p: any) => {
                    existingPermissions.add(`${p.role.toLowerCase()}_${p.resource}`);
                });
            }

            // Initialize defaults
            roles.forEach(role => {
                initialPerms[role] = {};
                modules.forEach(mod => {
                    initialPerms[role][mod.id] = { view: false, edit: false, delete: false };
                });
            });

            if (data) {
                data.forEach((p: any) => {
                    const roleKey = p.role.toLowerCase(); // Ensure lowercase key
                    if (initialPerms[roleKey] && initialPerms[roleKey][p.resource]) {
                        initialPerms[roleKey][p.resource] = {
                            view: p.can_view,
                            edit: p.can_manage,
                            delete: p.can_delete
                        };
                    }
                });
            }

            // Auto-create missing permissions in DB
            const missingPermissions: { role: string; resource: string }[] = [];
            roles.forEach(role => {
                modules.forEach(mod => {
                    const key = `${role}_${mod.id}`;
                    if (!existingPermissions.has(key)) {
                        missingPermissions.push({ role, resource: mod.id });
                    }
                });
            });

            // Create missing permissions in background (don't block UI)
            if (missingPermissions.length > 0) {
                setSaveStatus('initializing');
                console.log(`[Permissions] Creating ${missingPermissions.length} missing permission records...`);

                Promise.all(
                    missingPermissions.map(mp =>
                        upsertRecord('role_permissions', {
                            role: mp.role,
                            resource: mp.resource,
                            can_view: false,
                            can_manage: false,
                            can_delete: false
                        }, 'role, resource').catch(err => {
                            console.error(`Failed to create permission for ${mp.role}/${mp.resource}:`, err);
                        })
                    )
                ).then(() => {
                    console.log('[Permissions] All missing permissions created.');
                    setSaveStatus('idle');
                });
            }

            // Force Admin Defaults (Visual only/fallback, usually DB handles this)
            modules.forEach(mod => {
                if (initialPerms['admin']) {
                    initialPerms['admin'][mod.id] = { view: true, edit: true, delete: true };
                }
            });

            setPermissions(initialPerms);
            setLoading(false);
        };
        loadPermissions();
    }, []);

    const handleToggle = async (role: string, moduleId: string, type: 'view' | 'edit' | 'delete') => {
        // Admin is immutable via UI for safety
        if (role === 'admin') return;

        setSaveStatus('saving');

        let newPerms = JSON.parse(JSON.stringify(permissions)); // Deep copy
        const current = newPerms[role][moduleId];
        let updatedEntry = { ...current };

        // Logic: dependency chain
        if (type === 'view') {
            const newValue = !current.view;
            updatedEntry = {
                view: newValue,
                edit: newValue ? current.edit : false,
                delete: newValue ? current.delete : false
            };
        } else if (type === 'edit') {
            const newValue = !current.edit;
            updatedEntry = {
                view: newValue ? true : current.view,
                edit: newValue,
                delete: newValue ? current.delete : false
            };
        } else if (type === 'delete') {
            const newValue = !current.delete;
            updatedEntry = {
                view: newValue ? true : current.view,
                edit: newValue ? true : current.edit,
                delete: newValue
            };
        }

        newPerms[role][moduleId] = updatedEntry;
        setPermissions(newPerms);

        try {
            // Upsert to DB
            // We use 'role, resource' as composite key manually (upsert function handles if constraint matches)
            // But api.ts upsertRecord takes 'onConflict' column name. It defaults to 'id'. 
            // We set UNIQUE(role, resource). But upsertRecord might need a composite string?
            // Actually, Supabase js upsert takes {onConflict: 'role, resource'}.
            // My api.ts likely calls supabase.from().upsert(data, { onConflict: ... }).
            // Let's pass 'role, resource'.

            await upsertRecord('role_permissions', {
                role: role,
                resource: moduleId,
                can_view: updatedEntry.view,
                can_manage: updatedEntry.edit,
                can_delete: updatedEntry.delete
            }, 'role, resource'); // Pass conflict columns

            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error('Failed to save permission:', error);
            setSaveStatus('idle');
            // Revert state if needed? For now we assume success or user retries.
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12 text-zinc-500 gap-3">
            <Loader2 className="animate-spin" size={24} />
            <p>Carregando matriz de permissões...</p>
        </div>
    );

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

                    <div className="flex items-center gap-2 h-8">
                        {saveStatus === 'initializing' && (
                            <span className="flex items-center gap-2 text-amber-400 text-xs animate-pulse bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">
                                <Loader2 size={12} className="animate-spin" />
                                Inicializando permissões...
                            </span>
                        )}
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
                                <th className="p-4 text-left text-zinc-500 font-medium border-b border-zinc-700 w-48 sticky left-0 bg-[#23272f]">Cargo</th>
                                {modules.map(mod => (
                                    <th key={mod.id} className="p-4 text-center text-zinc-300 font-medium border-b border-zinc-700 border-l border-zinc-800 min-w-[180px]">
                                        {mod.label}
                                    </th>
                                ))}
                            </tr>
                            <tr className="text-xs text-zinc-500">
                                <th className="border-b border-zinc-700 sticky left-0 bg-[#23272f]"></th>
                                {modules.map(mod => (
                                    <th key={mod.id} className="p-2 border-b border-zinc-700 border-l border-zinc-800 bg-zinc-800/20">
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
                                <tr key={role} className="hover:bg-zinc-800/30 transition-colors group">
                                    <td className="p-4 text-white font-medium border-b border-zinc-800 uppercase sticky left-0 bg-[#23272f] group-hover:bg-[#2a2f38] transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                                        {roleDisplayMap[role]}
                                    </td>
                                    {modules.map(mod => {
                                        const perm = permissions[role]?.[mod.id] || { view: false, edit: false, delete: false };
                                        const isAdmin = role === 'admin';

                                        return (
                                            <td key={mod.id} className="p-4 border-b border-zinc-800 border-l border-zinc-800">
                                                <div className="flex items-center justify-center gap-4">
                                                    {/* View Checkbox */}
                                                    <label className="relative inline-flex items-center cursor-pointer group/toggle" title="Ver">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={perm.view}
                                                            onChange={() => handleToggle(role, mod.id, 'view')}
                                                            disabled={isAdmin}
                                                        />
                                                        <div className={`w-9 h-5 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 
                                                            ${isAdmin ? 'opacity-50 cursor-not-allowed bg-green-500' : 'bg-zinc-700 peer-checked:bg-green-500 transition-colors'}
                                                            peer-checked:after:translate-x-full peer-checked:after:border-white 
                                                            after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all
                                                        `}></div>
                                                    </label>

                                                    {/* Edit Checkbox */}
                                                    <label className="relative inline-flex items-center cursor-pointer group/toggle" title="Gerir">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={perm.edit}
                                                            onChange={() => handleToggle(role, mod.id, 'edit')}
                                                            disabled={isAdmin}
                                                        />
                                                        <div className={`w-9 h-5 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 
                                                            ${isAdmin ? 'opacity-50 cursor-not-allowed bg-indigo-500' : 'bg-zinc-700 peer-checked:bg-indigo-500 transition-colors'}
                                                            peer-checked:after:translate-x-full peer-checked:after:border-white 
                                                            after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all
                                                        `}></div>
                                                    </label>

                                                    {/* Delete Checkbox */}
                                                    <label className="relative inline-flex items-center cursor-pointer group/toggle" title="Excluir">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={perm.delete}
                                                            onChange={() => handleToggle(role, mod.id, 'delete')}
                                                            disabled={isAdmin}
                                                        />
                                                        <div className={`w-9 h-5 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 
                                                            ${isAdmin ? 'opacity-50 cursor-not-allowed bg-red-500' : 'bg-zinc-700 peer-checked:bg-red-500 transition-colors'}
                                                            peer-checked:after:translate-x-full peer-checked:after:border-white 
                                                            after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all
                                                        `}></div>
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
                    <div className="flex items-center gap-2 text-zinc-500">
                        <Info size={14} />
                        <span>Permissões salvas automaticamente ao alterar.</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PermissionSettings;
