import { useEffect } from 'react';
import { getSupabase } from '../lib/supabase';

export const useRealtimeSubscription = (tables: string[], onUpdate: () => void) => {
    useEffect(() => {
        const supabase = getSupabase();
        if (!supabase) return;

        // Create a single channel for all these tables
        const channel = supabase.channel(`realtime_updates_${tables.join('_')}`);

        tables.forEach(table => {
            channel.on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: table,
                },
                (payload) => {
                    console.log(`Realtime update received for ${table}:`, payload);
                    onUpdate();
                }
            );
        });

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`Subscribed to realtime updates for: ${tables.join(', ')}`);
            }
        });

        // Cleanup
        return () => {
            supabase.removeChannel(channel);
        };
    }, [tables.join(','), onUpdate]); // Re-subscribe if tables list changes
};
