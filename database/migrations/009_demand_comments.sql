-- Migration: Enhanced Demand Comments (Comentários em Demandas)
-- Adds advanced features to the existing comments table
-- IMPORTANTE: Esta versão usa a tabela 'profiles' ao invés de 'users'

-- Add new columns to the existing comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS mentions UUID[] DEFAULT '{}';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing comments to have user_name populated
UPDATE comments c
SET user_name = p.name
FROM profiles p
WHERE c.user_id = p.id AND c.user_name IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_demand_id ON comments(demand_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_mentions ON comments USING GIN(mentions);

-- Function to update demand's updated_at when comment is added
CREATE OR REPLACE FUNCTION update_demand_on_comment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE demands 
    SET updated_at = NOW()
    WHERE id = NEW.demand_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_demand_on_comment ON comments;
CREATE TRIGGER trigger_update_demand_on_comment
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_demand_on_comment();

-- Function to create notification when mentioned (if notifications table exists)
CREATE OR REPLACE FUNCTION notify_mentioned_users()
RETURNS TRIGGER AS $$
DECLARE
    v_mentioned_user UUID;
    v_demand_title TEXT;
    v_commenter_name TEXT;
BEGIN
    -- Get demand title
    SELECT title INTO v_demand_title FROM demands WHERE id = NEW.demand_id;
    
    -- Get commenter name
    SELECT name INTO v_commenter_name FROM profiles WHERE id = NEW.user_id;
    
    -- Create notification for each mentioned user (only if notifications table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        FOREACH v_mentioned_user IN ARRAY COALESCE(NEW.mentions, '{}')
        LOOP
            -- Skip if mentioning yourself
            IF v_mentioned_user != NEW.user_id THEN
                INSERT INTO notifications (
                    user_id,
                    title,
                    message,
                    type,
                    data
                ) VALUES (
                    v_mentioned_user,
                    'Você foi mencionado',
                    COALESCE(v_commenter_name, 'Alguém') || ' mencionou você em "' || COALESCE(v_demand_title, 'uma demanda') || '"',
                    'mention',
                    jsonb_build_object(
                        'demand_id', NEW.demand_id,
                        'comment_id', NEW.id,
                        'commenter_id', NEW.user_id
                    )
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_mentions ON comments;
CREATE TRIGGER trigger_notify_mentions
    AFTER INSERT ON comments
    FOR EACH ROW
    WHEN (array_length(NEW.mentions, 1) > 0)
    EXECUTE FUNCTION notify_mentioned_users();

-- Log comment activity (if activity_logs table exists)
CREATE OR REPLACE FUNCTION log_comment_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if activity_logs table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
        INSERT INTO activity_logs (
            user_id,
            user_name,
            action,
            action_label,
            entity_type,
            entity_id,
            entity_title,
            metadata
        ) VALUES (
            NEW.user_id,
            COALESCE(NEW.user_name, 'Usuário'),
            'commented',
            'comentou em',
            'demand',
            NEW.demand_id,
            (SELECT title FROM demands WHERE id = NEW.demand_id),
            jsonb_build_object(
                'comment_id', NEW.id,
                'comment_preview', LEFT(NEW.content, 100)
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_comment ON comments;
CREATE TRIGGER trigger_log_comment
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION log_comment_activity();
