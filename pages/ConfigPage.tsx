import React, { useState } from 'react';
import SupabaseSettings from '../components/settings/SupabaseSettings';
import ResetSettings from '../components/settings/ResetSettings';
import PermissionSettings from '../components/settings/PermissionSettings';

const ConfigPage = () => {
    const [activeTab, setActiveTab] = useState('system');

    return (
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
                    <p className="text-zinc-400">Gerencie as conexões, permissões e manutenção do sistema.</p>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-xl w-fit border border-zinc-800">
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'system'
                            ? 'bg-zinc-800 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                            }`}
                    >
                        Integrações
                    </button>
                    <button
                        onClick={() => setActiveTab('permissions')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'permissions'
                            ? 'bg-zinc-800 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                            }`}
                    >
                        Permissões
                    </button>
                    <button
                        onClick={() => setActiveTab('reset')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'reset'
                            ? 'bg-red-500/10 text-red-500 shadow-sm border border-red-500/20'
                            : 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50'
                            }`}
                    >
                        Reset do Sistema
                    </button>
                </div>

                {/* Content */}
                <div className="mt-6">
                    {activeTab === 'system' && <SupabaseSettings />}
                    {activeTab === 'permissions' && <PermissionSettings />}
                    {activeTab === 'reset' && <ResetSettings />}
                </div>

            </div>
        </div>
    );
};

export default ConfigPage;
