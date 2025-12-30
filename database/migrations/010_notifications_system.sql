-- Migration: Notifications System
-- Creates notifications table and triggers for real-time alerts

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'mention', 'assignment', 'deadline', 'status_change')),
    reference_type TEXT, -- 'demand', 'comment', etc
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- 3. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- 5. Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT DEFAULT NULL,
    p_type TEXT DEFAULT 'info',
    p_reference_type TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_reference_type, p_reference_id)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- 6. Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = auth.uid() AND is_read = false;
END;
$$;

-- 7. Trigger function: Notify on demand assignment
CREATE OR REPLACE FUNCTION public.notify_demand_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_demand_title TEXT;
    v_assigner_name TEXT;
BEGIN
    -- Only trigger if responsible_id changed and new value is not null
    IF (OLD.responsible_id IS DISTINCT FROM NEW.responsible_id) AND NEW.responsible_id IS NOT NULL THEN
        -- Get demand title
        v_demand_title := NEW.title;
        
        -- Get assigner name (current user)
        SELECT name INTO v_assigner_name
        FROM public.profiles
        WHERE id = auth.uid();
        
        -- Create notification for the assigned designer
        PERFORM public.create_notification(
            NEW.responsible_id,
            'Nova demanda atribuída',
            'Você foi atribuído à demanda: ' || COALESCE(v_demand_title, 'Sem título'),
            'assignment',
            'demand',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 8. Trigger function: Notify on status change
CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_demand_title TEXT;
    v_old_status_name TEXT;
    v_new_status_name TEXT;
    v_responsible_id UUID;
BEGIN
    -- Only trigger if status_id changed
    IF (OLD.status_id IS DISTINCT FROM NEW.status_id) THEN
        v_demand_title := NEW.title;
        v_responsible_id := NEW.responsible_id;
        
        -- Get status names
        SELECT name INTO v_old_status_name FROM public.statuses WHERE id = OLD.status_id;
        SELECT name INTO v_new_status_name FROM public.statuses WHERE id = NEW.status_id;
        
        -- Notify the responsible designer (if different from current user)
        IF v_responsible_id IS NOT NULL AND v_responsible_id != auth.uid() THEN
            PERFORM public.create_notification(
                v_responsible_id,
                'Status alterado',
                'Demanda "' || COALESCE(v_demand_title, 'Sem título') || '" mudou de ' || 
                COALESCE(v_old_status_name, '?') || ' para ' || COALESCE(v_new_status_name, '?'),
                'status_change',
                'demand',
                NEW.id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 9. Create triggers on demands table
DROP TRIGGER IF EXISTS trigger_notify_demand_assignment ON public.demands;
CREATE TRIGGER trigger_notify_demand_assignment
    AFTER UPDATE ON public.demands
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_demand_assignment();

DROP TRIGGER IF EXISTS trigger_notify_status_change ON public.demands;
CREATE TRIGGER trigger_notify_status_change
    AFTER UPDATE ON public.demands
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_status_change();

-- 10. Function to check and notify upcoming deadlines (run daily via cron)
CREATE OR REPLACE FUNCTION public.check_deadline_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_demand RECORD;
    v_days_until_deadline INTEGER;
BEGIN
    -- Find demands with deadlines in 1 day or today that haven't been completed
    FOR v_demand IN
        SELECT d.id, d.title, d.deadline, d.responsible_id, s.name as status_name
        FROM public.demands d
        LEFT JOIN public.statuses s ON d.status_id = s.id
        WHERE d.deadline IS NOT NULL
          AND d.responsible_id IS NOT NULL
          AND d.deadline::date <= (CURRENT_DATE + INTERVAL '1 day')
          AND d.deadline::date >= CURRENT_DATE
          AND LOWER(COALESCE(s.name, '')) NOT LIKE '%conclu%'
          AND LOWER(COALESCE(s.name, '')) NOT LIKE '%entregue%'
          AND LOWER(COALESCE(s.name, '')) NOT LIKE '%finalizado%'
    LOOP
        v_days_until_deadline := (v_demand.deadline::date - CURRENT_DATE);
        
        -- Check if notification already sent today for this demand
        IF NOT EXISTS (
            SELECT 1 FROM public.notifications
            WHERE reference_id = v_demand.id
              AND type = 'deadline'
              AND created_at::date = CURRENT_DATE
        ) THEN
            IF v_days_until_deadline = 0 THEN
                PERFORM public.create_notification(
                    v_demand.responsible_id,
                    '⚠️ Prazo HOJE!',
                    'A demanda "' || COALESCE(v_demand.title, 'Sem título') || '" vence HOJE!',
                    'deadline',
                    'demand',
                    v_demand.id
                );
            ELSIF v_days_until_deadline = 1 THEN
                PERFORM public.create_notification(
                    v_demand.responsible_id,
                    '📅 Prazo amanhã',
                    'A demanda "' || COALESCE(v_demand.title, 'Sem título') || '" vence amanhã.',
                    'deadline',
                    'demand',
                    v_demand.id
                );
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- 11. Enable realtime for notifications (only if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_deadline_notifications TO authenticated;
