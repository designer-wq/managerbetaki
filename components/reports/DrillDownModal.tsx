import React, { useState } from 'react';
import { X, ExternalLink, Calendar, User, Flag } from 'lucide-react';

interface DrillDownModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    demands: any[];
    onDemandClick?: (demand: any) => void;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    demands,
    onDemandClick
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const filteredDemands = demands.filter(d =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.responsible?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'alta': return 'text-red-500 bg-red-500/10';
            case 'baixa': return 'text-blue-500 bg-blue-500/10';
            default: return 'text-yellow-500 bg-yellow-500/10';
        }
    };

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('conclu') || s.includes('entregue')) return 'bg-emerald-500/10 text-emerald-500';
        if (s.includes('produ') || s.includes('andamento')) return 'bg-blue-500/10 text-blue-500';
        if (s.includes('revis')) return 'bg-yellow-500/10 text-yellow-500';
        if (s.includes('backlog')) return 'bg-zinc-500/10 text-zinc-400';
        return 'bg-zinc-500/10 text-zinc-400';
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-4 md:inset-10 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-800">
                    <div>
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                        {subtitle && <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-zinc-500">{filteredDemands.length} itens</span>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-zinc-800">
                    <input
                        type="text"
                        placeholder="Buscar por título ou responsável..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {filteredDemands.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-zinc-500">
                            Nenhuma demanda encontrada
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredDemands.map((demand) => (
                                <div
                                    key={demand.id}
                                    onClick={() => onDemandClick?.(demand)}
                                    className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 hover:bg-zinc-800 hover:border-zinc-600 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-medium text-sm truncate group-hover:text-primary transition-colors">
                                                {demand.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(demand.statuses?.name)}`}>
                                                    {demand.statuses?.name || 'Sem Status'}
                                                </span>
                                                {demand.priority && (
                                                    <span className={`text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1 ${getPriorityColor(demand.priority)}`}>
                                                        <Flag size={10} />
                                                        {demand.priority}
                                                    </span>
                                                )}
                                                {demand.demand_types?.name && (
                                                    <span className="text-xs text-zinc-500">
                                                        {demand.demand_types.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 text-xs text-zinc-500 shrink-0">
                                            {demand.responsible?.name && (
                                                <div className="flex items-center gap-1">
                                                    <User size={12} />
                                                    <span>{demand.responsible.name}</span>
                                                </div>
                                            )}
                                            {demand.deadline && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    <span>{new Date(demand.deadline).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// Hook for managing drill-down state
export const useDrillDown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [demands, setDemands] = useState<any[]>([]);

    const open = (config: { title: string; subtitle?: string; demands: any[] }) => {
        setTitle(config.title);
        setSubtitle(config.subtitle || '');
        setDemands(config.demands);
        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
    };

    return {
        isOpen,
        title,
        subtitle,
        demands,
        open,
        close
    };
};

export default DrillDownModal;
