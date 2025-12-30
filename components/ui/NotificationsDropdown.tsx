import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Clock, User, AlertCircle, MessageSquare, Target } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationsContext';
import type { Notification as NotificationType } from '../../contexts/NotificationsContext';

interface NotificationsDropdownProps {
    className?: string;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Request browser notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const getNotificationIcon = (type: NotificationType['type']) => {
        switch (type) {
            case 'assignment':
                return <User size={16} className="text-blue-400" />;
            case 'deadline':
                return <Clock size={16} className="text-yellow-400" />;
            case 'status_change':
                return <Target size={16} className="text-green-400" />;
            case 'mention':
                return <MessageSquare size={16} className="text-purple-400" />;
            case 'warning':
                return <AlertCircle size={16} className="text-orange-400" />;
            case 'error':
                return <AlertCircle size={16} className="text-red-400" />;
            case 'success':
                return <Check size={16} className="text-emerald-400" />;
            default:
                return <Bell size={16} className="text-zinc-400" />;
        }
    };

    const getNotificationBgColor = (type: NotificationType['type']) => {
        switch (type) {
            case 'assignment':
                return 'bg-blue-500/10';
            case 'deadline':
                return 'bg-yellow-500/10';
            case 'status_change':
                return 'bg-green-500/10';
            case 'mention':
                return 'bg-purple-500/10';
            case 'warning':
                return 'bg-orange-500/10';
            case 'error':
                return 'bg-red-500/10';
            default:
                return 'bg-zinc-800';
        }
    };

    const handleNotificationClick = async (notification: NotificationType) => {
        if (!notification.is_read) {
            await markAsRead([notification.id]);
        }

        // Navigate to the referenced item if applicable
        if (notification.reference_type === 'demand' && notification.reference_id) {
            // Could navigate to demand - for now just mark as read
            window.location.hash = `/demands`;
        }

        setIsOpen(false);
    };

    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Agora';
            if (diffMins < 60) return `${diffMins}min`;
            if (diffHours < 24) return `${diffHours}h`;
            if (diffDays < 7) return `${diffDays}d`;
            return date.toLocaleDateString('pt-BR');
        } catch {
            return '';
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Bell Button with Badge */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all border border-zinc-700/50 hover:border-zinc-600"
            >
                <Bell size={18} />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-black bg-primary rounded-full animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-scale-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
                        <div className="flex items-center gap-2">
                            <Bell size={16} className="text-primary" />
                            <h3 className="text-white font-semibold text-sm">Notificações</h3>
                            {unreadCount > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-primary transition-colors"
                            >
                                <CheckCheck size={14} />
                                <span>Marcar todas</span>
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="size-6 border-2 border-zinc-700 border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                <Bell size={32} className="mb-3 opacity-50" />
                                <p className="text-sm">Nenhuma notificação</p>
                                <p className="text-xs mt-1 opacity-70">Você está em dia!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-800/50">
                                {notifications.slice(0, 20).map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`
                                            flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                                            ${!notification.is_read
                                                ? 'bg-zinc-800/30 hover:bg-zinc-800/50'
                                                : 'hover:bg-zinc-800/30'
                                            }
                                        `}
                                    >
                                        {/* Icon */}
                                        <div className={`
                                            flex-shrink-0 flex items-center justify-center 
                                            size-9 rounded-xl ${getNotificationBgColor(notification.type)}
                                        `}>
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-medium ${!notification.is_read ? 'text-white' : 'text-zinc-300'}`}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                                                    {formatTime(notification.created_at)}
                                                </span>
                                            </div>

                                            {notification.message && (
                                                <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            )}

                                            {/* Unread Indicator */}
                                            {!notification.is_read && (
                                                <div className="flex items-center gap-1 mt-1.5">
                                                    <div className="size-1.5 rounded-full bg-primary" />
                                                    <span className="text-[10px] text-primary font-medium">Não lida</span>
                                                </div>
                                            )}
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
                                    window.location.hash = '/activity-log';
                                    setIsOpen(false);
                                }}
                                className="w-full text-center text-xs text-zinc-400 hover:text-primary transition-colors"
                            >
                                Ver histórico completo →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsDropdown;
