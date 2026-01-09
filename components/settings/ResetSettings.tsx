import React, { useState } from 'react';
import { Trash2, AlertTriangle, RefreshCcw, Check, Database, Users, Tag, AlertCircle } from 'lucide-react';

const ResetSettings = () => {
    const [confirmFullReset, setConfirmFullReset] = useState(false);
    const [resetting, setResetting] = useState<string | null>(null);

    const handleReset = (type: string) => {
        setResetting(type);
        // Simulate API call
        setTimeout(() => {
            setResetting(null);
            if (type === 'full') setConfirmFullReset(false);
            // In a real app, this would trigger a toast notification
            console.log(`Reset executed: ${type}`);
        }, 1500);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Danger Zone - Full Reset */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-red-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Zona de Perigo</h3>
                    </div>
                    <p className="text-zinc-400 text-sm">
                        Ações nesta área são irreversíveis. Tenha certeza absoluta antes de prosseguir.
                    </p>
                </div>

                <div className="p-6 bg-red-500/5">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h4 className="text-white font-bold text-lg mb-1">Reset Completo do Sistema</h4>
                            <p className="text-zinc-400 text-sm max-w-xl">
                                Esta ação irá apagar <strong>todos</strong> os dados do sistema, incluindo usuários, demandas, configurações, origens e status. O sistema voltará ao estado original de instalação.
                            </p>
                        </div>

                        {!confirmFullReset ? (
                            <button
                                onClick={() => setConfirmFullReset(true)}
                                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shrink-0"
                            >
                                <Trash2 size={20} />
                                Resetar Tudo
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-200">
                                <span className="text-sm font-bold text-red-400">Tem certeza?</span>
                                <button
                                    onClick={() => setConfirmFullReset(false)}
                                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleReset('full')}
                                    disabled={resetting === 'full'}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {resetting === 'full' ? <RefreshCcw className="animate-spin" size={18} /> : <AlertTriangle size={18} />}
                                    Confirmar Reset
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Individual Resets */}
            <div className="bg-[#23272f] rounded-xl border border-zinc-700/50 shadow-xl overflow-hidden p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Database size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Resets Individuais</h3>
                        <p className="text-zinc-400 text-sm">Limpe dados de módulos específicos sem afetar o restante do sistema.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reset Users */}
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                                <Users size={20} />
                            </div>
                            <div>
                                <h5 className="text-white font-medium">Usuários</h5>
                                <p className="text-xs text-zinc-500">Remove todos os usuários cadastrados (exceto você)</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleReset('users')}
                            disabled={!!resetting}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Resetar Usuários"
                        >
                            {resetting === 'users' ? <RefreshCcw className="animate-spin" size={20} /> : <Trash2 size={20} />}
                        </button>
                    </div>

                    {/* Reset Origins */}
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                                <Tag size={20} />
                            </div>
                            <div>
                                <h5 className="text-white font-medium">Origens</h5>
                                <p className="text-xs text-zinc-500">Reseta para as origens padrão</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleReset('origins')}
                            disabled={!!resetting}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Resetar Origens"
                        >
                            {resetting === 'origins' ? <RefreshCcw className="animate-spin" size={20} /> : <Trash2 size={20} />}
                        </button>
                    </div>

                    {/* Reset Demand Types */}
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h5 className="text-white font-medium">Tipos de Demanda</h5>
                                <p className="text-xs text-zinc-500">Reseta para os tipos padrão</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleReset('types')}
                            disabled={!!resetting}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Resetar Tipos"
                        >
                            {resetting === 'types' ? <RefreshCcw className="animate-spin" size={20} /> : <Trash2 size={20} />}
                        </button>
                    </div>

                    {/* Reset Status */}
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                                <Check size={20} />
                            </div>
                            <div>
                                <h5 className="text-white font-medium">Status</h5>
                                <p className="text-xs text-zinc-500">Reseta para os status e cores padrão</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleReset('status')}
                            disabled={!!resetting}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Resetar Status"
                        >
                            {resetting === 'status' ? <RefreshCcw className="animate-spin" size={20} /> : <Trash2 size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetSettings;
