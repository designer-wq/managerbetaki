import React, { useState } from 'react';
import {
    Bell,
    X,
    Check,
    CheckCheck,
    User,
    Clock,
    MessageSquare,
    AlertCircle,
    Info,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';
import { useNotifications, Notification } from '../../contexts/NotificationsContext';
import { formatDistanceToNow } from '../../lib/utils';

interface NotificationCenterProps {
    className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'assignment':
                return <User size={16} className="text-blue-400" />;
            case 'mention':
                return <MessageSquare size={16} className="text-purple-400" />;
            case 'deadline':
                return <Clock size={16} className="text-orange-400" />;
            case 'success':
                return <CheckCircle size={16} className="text-green-400" />;
            case 'warning':
                return <AlertTriangle size={16} className="text-yellow-400" />;
            case 'error':
                return <AlertCircle size={16} className="text-red-400" />;
            default:
                return <Info size={16} className="text-zinc-400" />;
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead([notification.id]);
        }

        // Navigate to reference if exists
        if (notification.reference_type === 'demand' && notification.reference_id) {
            // Could use navigate here if wrapped in Router context
            window.location.hash = `/demands?id=${notification.reference_id}`;
        }

        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center size-10 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
                <Bell size={20} className="text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-black text-[10px] font-bold rounded-full px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                            <h3 className="text-white font-bold text-sm">Notificações</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                                        title="Marcar todas como lidas"
                                    >
                                        <CheckCheck size={14} />
                                        <span className="hidden sm:inline">Marcar todas</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="p-8 text-center text-zinc-500">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <p className="text-sm">Carregando...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell size={32} className="text-zinc-600 mx-auto mb-3" />
                                    <p className="text-zinc-500 text-sm">Nenhuma notificação</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-800/50">
                                    {notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`
                        px-4 py-3 cursor-pointer transition-colors
                        ${notification.is_read
                                                    ? 'bg-transparent hover:bg-zinc-800/30'
                                                    : 'bg-zinc-800/50 hover:bg-zinc-800'
                                                }
                      `}
                                        >
                                            <div className="flex gap-3">
                                                {/* Icon */}
                                                <div className="shrink-0 mt-0.5">
                                                    <div className="size-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                                        {getIcon(notification.type)}
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={`text-sm font-medium ${notification.is_read ? 'text-zinc-300' : 'text-white'}`}>
                                                            {notification.title}
                                                        </p>
                                                        {!notification.is_read && (
                                                            <span className="shrink-0 size-2 bg-primary rounded-full mt-1.5" />
                                                        )}
                                                    </div>
                                                    {notification.message && (
                                                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    )}
                                                    <p className="text-[10px] text-zinc-600 mt-1">
                                                        {formatDistanceToNow(notification.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/80">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        // Navigate to notifications page if exists
                                    }}
                                    className="w-full text-center text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                                >
                                    Ver todas as notificações
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationCenter;
