import React, { useState, useEffect } from 'react';
import {
    History,
    User,
    FileText,
    MessageCircle,
    ArrowRight,
    Filter,
    Clock,
    UserPlus,
    Edit,
    Trash2,
    CheckCircle,
    RefreshCw
} from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

interface ActivityLog {
    id: string;
    user_id: string;
    user_name: string;
    action: string;
    action_label: string;
    entity_type: string;
    entity_id: string;
    entity_title: string;
    old_value: string | null;
    new_value: string | null;
    metadata: Record<string, any>;
    created_at: string;
}

interface ActivityLogFeedProps {
    entityType?: string; // Filter by entity type
    entityId?: string; // Filter by specific entity
    userId?: string; // Filter by user
    limit?: number;
    showFilters?: boolean;
    compact?: boolean;
}

export const ActivityLogFeed: React.FC<ActivityLogFeedProps> = ({
    entityType,
    entityId,
    userId,
    limit = 50,
    showFilters = true,
    compact = false
}) => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const pageSize = 20;

    useEffect(() => {
        fetchLogs();
    }, [entityType, entityId, userId, filter, page]);

    const fetchLogs = async () => {
        const supabase = getSupabase();
        if (!supabase) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            let query = supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .range((page - 1) * pageSize, page * pageSize - 1);

            if (entityType) query = query.eq('entity_type', entityType);
            if (entityId) query = query.eq('entity_id', entityId);
            if (userId) query = query.eq('user_id', userId);
            if (filter !== 'all') query = query.eq('action', filter);

            const { data, error } = await query;

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching activity logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        const icons: Record<string, React.ReactNode> = {
            created: <FileText size={14} className="text-green-400" />,
            updated: <Edit size={14} className="text-blue-400" />,
            deleted: <Trash2 size={14} className="text-red-400" />,
            status_changed: <RefreshCw size={14} className="text-orange-400" />,
            assigned: <UserPlus size={14} className="text-purple-400" />,
            commented: <MessageCircle size={14} className="text-primary" />,
            completed: <CheckCircle size={14} className="text-green-500" />
        };
        return icons[action] || <History size={14} className="text-zinc-400" />;
    };

    const getActionColor = (action: string) => {
        const colors: Record<string, string> = {
            created: 'bg-green-500/10 border-green-500/20',
            updated: 'bg-blue-500/10 border-blue-500/20',
            deleted: 'bg-red-500/10 border-red-500/20',
            status_changed: 'bg-orange-500/10 border-orange-500/20',
            assigned: 'bg-purple-500/10 border-purple-500/20',
            commented: 'bg-primary/10 border-primary/20',
            completed: 'bg-green-500/10 border-green-500/20'
        };
        return colors[action] || 'bg-zinc-500/10 border-zinc-500/20';
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'agora mesmo';
        if (minutes < 60) return `há ${minutes} min`;
        if (hours < 24) return `há ${hours}h`;
        if (days < 7) return `há ${days} dias`;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const formatFullDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const groupLogsByDate = (logs: ActivityLog[]) => {
        const groups: Record<string, ActivityLog[]> = {};

        logs.forEach(log => {
            const date = new Date(log.created_at);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let key: string;
            if (date.toDateString() === today.toDateString()) {
                key = 'Hoje';
            } else if (date.toDateString() === yesterday.toDateString()) {
                key = 'Ontem';
            } else {
                key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(log);
        });

        return groups;
    };

    const groupedLogs = groupLogsByDate(logs);

    const filterOptions = [
        { value: 'all', label: 'Todas' },
        { value: 'created', label: 'Criação' },
        { value: 'updated', label: 'Edição' },
        { value: 'status_changed', label: 'Status' },
        { value: 'commented', label: 'Comentários' },
        { value: 'assigned', label: 'Atribuição' }
    ];

    if (compact) {
        return (
            <div className="space-y-2">
                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-2 p-2 animate-pulse">
                                <div className="w-4 h-4 rounded-full bg-zinc-800" />
                                <div className="flex-1">
                                    <div className="h-3 bg-zinc-800 rounded w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-4">Nenhuma atividade</p>
                ) : (
                    logs.slice(0, limit).map(log => (
                        <div key={log.id} className="flex items-start gap-2 text-xs">
                            {getActionIcon(log.action)}
                            <span className="text-zinc-400">
                                <span className="text-white font-medium">{log.user_name}</span>
                                {' '}{log.action_label}{' '}
                                {log.entity_title && (
                                    <span className="text-zinc-300">"{log.entity_title}"</span>
                                )}
                                {log.old_value && log.new_value && (
                                    <span className="text-zinc-500">
                                        {' '}de "{log.old_value}" para "{log.new_value}"
                                    </span>
                                )}
                            </span>
                            <span className="text-zinc-600 ml-auto whitespace-nowrap">
                                {formatTime(log.created_at)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with filters */}
            {showFilters && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-zinc-400" />
                        <h3 className="text-sm font-medium text-white">Histórico de Atividades</h3>
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-zinc-500" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="text-xs bg-zinc-900 border border-white/10 rounded px-2 py-1 text-zinc-300"
                        >
                            {filterOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Activity Timeline */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-zinc-800" />
                                <div className="flex-1">
                                    <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12">
                        <History size={40} className="mx-auto text-zinc-700 mb-3" />
                        <p className="text-sm text-zinc-500">Nenhuma atividade registrada</p>
                    </div>
                ) : (
                    Object.entries(groupedLogs).map(([date, dateLogs]) => (
                        <div key={date}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-px flex-1 bg-white/5" />
                                <span className="text-xs text-zinc-500 font-medium px-2">{date}</span>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>

                            <div className="space-y-3">
                                {dateLogs.map((log, index) => (
                                    <div
                                        key={log.id}
                                        className="group flex gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                                    >
                                        {/* Timeline dot */}
                                        <div className="relative">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getActionColor(log.action)}`}>
                                                {getActionIcon(log.action)}
                                            </div>
                                            {index < dateLogs.length - 1 && (
                                                <div className="absolute top-8 left-1/2 w-px h-6 bg-white/5 -translate-x-1/2" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-zinc-300">
                                                <span className="font-medium text-white">{log.user_name}</span>
                                                {' '}{log.action_label}{' '}
                                                {log.entity_title && (
                                                    <span className="text-zinc-200">"{log.entity_title}"</span>
                                                )}
                                            </p>

                                            {/* Status change details */}
                                            {log.action === 'status_changed' && log.old_value && log.new_value && (
                                                <div className="flex items-center gap-2 mt-1 text-xs">
                                                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">
                                                        {log.old_value}
                                                    </span>
                                                    <ArrowRight size={12} className="text-zinc-600" />
                                                    <span className="px-2 py-0.5 bg-primary/20 rounded text-primary">
                                                        {log.new_value}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Comment preview */}
                                            {log.action === 'commented' && log.metadata?.comment_preview && (
                                                <p className="mt-1 text-xs text-zinc-500 italic line-clamp-1">
                                                    "{log.metadata.comment_preview}"
                                                </p>
                                            )}

                                            <span
                                                className="text-xs text-zinc-600 mt-1 block"
                                                title={formatFullDate(log.created_at)}
                                            >
                                                <Clock size={10} className="inline mr-1" />
                                                {formatTime(log.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Load more */}
            {logs.length >= pageSize && (
                <button
                    onClick={() => setPage(p => p + 1)}
                    className="w-full py-2 text-sm text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                    Carregar mais
                </button>
            )}
        </div>
    );
};

export default ActivityLogFeed;
