-- Notifications Table for Push Notifications
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error, mention, assignment, deadline
    reference_type TEXT, -- demand, comment, user, etc
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT DEFAULT NULL,
    p_type TEXT DEFAULT 'info',
    p_reference_type TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_reference_type, p_reference_id)
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(p_notification_ids UUID[])
RETURNS void AS $$
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, read_at = NOW()
    WHERE id = ANY(p_notification_ids) AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void AS $$
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to notify on demand assignment change
CREATE OR REPLACE FUNCTION notify_demand_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.responsible_id IS NOT NULL AND 
       (OLD.responsible_id IS NULL OR NEW.responsible_id != OLD.responsible_id) THEN
        
        PERFORM create_notification(
            NEW.responsible_id,
            'Nova Demanda Atribuída',
            'Você foi atribuído à demanda: ' || NEW.title,
            'assignment',
            'demand',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (if not exists)
DROP TRIGGER IF EXISTS trigger_demand_assignment ON demands;
CREATE TRIGGER trigger_demand_assignment
    AFTER UPDATE ON demands
    FOR EACH ROW
    EXECUTE FUNCTION notify_demand_assignment();

-- Trigger to notify on mention in comment
CREATE OR REPLACE FUNCTION notify_comment_mention()
RETURNS TRIGGER AS $$
DECLARE
    mentioned_user_id UUID;
    mentioned_name TEXT;
    demand_title TEXT;
BEGIN
    -- Check if comment contains @ mention
    IF NEW.content LIKE '%@%' THEN
        -- Get demand title
        SELECT title INTO demand_title FROM demands WHERE id = NEW.demand_id;
        
        -- This is simplified - in production you'd parse @mentions properly
        -- For now, just notify demand owner
        SELECT responsible_id INTO mentioned_user_id FROM demands WHERE id = NEW.demand_id;
        
        IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
            PERFORM create_notification(
                mentioned_user_id,
                'Você foi mencionado',
                'Novo comentário na demanda: ' || COALESCE(demand_title, 'Demanda'),
                'mention',
                'demand',
                NEW.demand_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_comment_mention ON comments;
CREATE TRIGGER trigger_comment_mention
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_comment_mention();
