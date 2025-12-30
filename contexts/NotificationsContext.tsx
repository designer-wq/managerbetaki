import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getSupabase } from '../lib/supabase';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string | null;
    type: 'info' | 'success' | 'warning' | 'error' | 'mention' | 'assignment' | 'deadline' | 'status_change';
    reference_type: string | null;
    reference_id: string | null;
    is_read: boolean;
    created_at: string;
    read_at: string | null;
}

interface NotificationsContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (ids: string[]) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearNotification: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
    notifications: [],
    unreadCount: 0,
    loading: false,
    fetchNotifications: async () => { },
    markAsRead: async () => { },
    markAllAsRead: async () => { },
    clearNotification: () => { },
});

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, profile } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const userId = profile?.id || user?.id;

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;

        const supabase = getSupabase();
        if (!supabase) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching notifications:', error);
                return;
            }

            setNotifications(data || []);
        } catch (err) {
            console.error('Error in fetchNotifications:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const markAsRead = useCallback(async (ids: string[]) => {
        if (!ids.length) return;

        const supabase = getSupabase();
        if (!supabase) return;

        try {
            // Use direct update instead of RPC for better type safety
            // Note: Cast to any since notifications table types aren't generated yet
            await (supabase as any)
                .from('notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .in('id', ids);

            setNotifications(prev =>
                prev.map(n =>
                    ids.includes(n.id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
                )
            );
        } catch (err) {
            console.error('Error marking notifications as read:', err);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        const supabase = getSupabase();
        if (!supabase) return;

        try {
            await supabase.rpc('mark_all_notifications_read');

            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
            );
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
        }
    }, []);

    const clearNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Initial fetch
    useEffect(() => {
        if (userId) {
            fetchNotifications();
        }
    }, [userId, fetchNotifications]);

    // Realtime subscription
    useEffect(() => {
        if (!userId) return;

        const supabase = getSupabase();
        if (!supabase) return;

        const channel = supabase
            .channel('notifications-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    setNotifications(prev => [newNotif, ...prev]);

                    // Optional: Show browser notification if permission granted
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(newNotif.title, {
                            body: newNotif.message || undefined,
                            icon: '/logo.png'
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <NotificationsContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            markAsRead,
            markAllAsRead,
            clearNotification
        }}>
            {children}
        </NotificationsContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationsContext);
