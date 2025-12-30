import React from 'react';
import Header from '../components/Header';
import ActivityLogFeed from '../components/ui/ActivityLogFeed';

const ActivityLogPage: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
            <Header
                title="Histórico de Atividades"
                subtitle="Auditoria completa de todas as alterações no sistema"
            />

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-5xl mx-auto">
                    {/* Info Card */}
                    <div className="mb-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                        <p className="text-zinc-400 text-sm">
                            Este log registra todas as alterações feitas nas demandas, incluindo mudanças de status,
                            atribuições de responsáveis, comentários e outras modificações importantes.
                        </p>
                    </div>

                    {/* Activity Log Feed */}
                    <ActivityLogFeed showFilters={true} maxItems={100} />
                </div>
            </div>
        </div>
    );
};

export default ActivityLogPage;
