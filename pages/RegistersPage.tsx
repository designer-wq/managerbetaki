import React, { useState } from 'react';
import Header from '../components/Header';
import { Layers, Tag, CheckCircle, Briefcase, Image } from 'lucide-react';
import GeneralSettings from '../components/settings/GeneralSettings';

type TabType = 'origins' | 'types' | 'statuses' | 'jobs' | 'visual';

const RegistersPage = () => {
    const [activeTab, setActiveTab] = useState<TabType>('origins');

    const tabs = [
        { id: 'origins' as TabType, label: 'Origens', icon: Layers, description: 'De onde vem as demandas' },
        { id: 'types' as TabType, label: 'Tipos de Demanda', icon: Tag, description: 'Categorias de trabalho' },
        { id: 'statuses' as TabType, label: 'Status', icon: CheckCircle, description: 'Estados das demandas' },
        { id: 'jobs' as TabType, label: 'Cargos', icon: Briefcase, description: 'Funções da equipe' },
        { id: 'visual' as TabType, label: 'Identidade Visual', icon: Image, description: 'Logo e aparência' },
    ];

    const currentTab = tabs.find(t => t.id === activeTab);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-950">
            <Header
                title="Cadastros"
                subtitle="Gerencie origens, tipos de demanda, status e cargos"
            />

            <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 custom-scrollbar">
                <div className="max-w-5xl mx-auto">

                    {/* Tabs Navigation */}
                    <div className="mb-8">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            relative flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-200 border
                                            ${isActive
                                                ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10'
                                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700'
                                            }
                                        `}
                                    >
                                        <div className={`p-2 rounded-lg ${isActive ? 'bg-primary/20' : 'bg-zinc-800'}`}>
                                            <Icon size={20} />
                                        </div>
                                        <span className="text-sm font-medium">{tab.label}</span>
                                        {isActive && (
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section Header */}
                    <div className="mb-6 flex items-center gap-4">
                        {currentTab && (
                            <>
                                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                                    <currentTab.icon size={24} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{currentTab.label}</h2>
                                    <p className="text-zinc-500 text-sm">{currentTab.description}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <GeneralSettings filterSection={activeTab} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistersPage;
