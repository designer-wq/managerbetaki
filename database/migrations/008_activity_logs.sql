-- Migration: Activity Log (Histórico de Atividades)
-- Tracks all user actions for audit and transparency
-- IMPORTANTE: Esta versão usa a tabela 'profiles' ao invés de 'users'

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who performed the action
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL, -- Denormalized for quick display
    
    -- What action was performed
    action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed', 'assigned', 'commented'
    action_label TEXT NOT NULL, -- Human readable: 'criou', 'atualizou', 'excluiu', etc.
    
    -- Target of the action
    entity_type TEXT NOT NULL, -- 'demand', 'user', 'comment', 'status', etc.
    entity_id UUID, -- ID of the affected entity
    entity_title TEXT, -- Title/name for quick display without joins
    
    -- Additional context
    old_value TEXT, -- Previous value (for updates)
    new_value TEXT, -- New value (for updates)
    metadata JSONB DEFAULT '{}', -- Any additional structured data
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- RLS Policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Everyone can read activity logs (for transparency)
DROP POLICY IF EXISTS "activity_logs_select_all" ON activity_logs;
CREATE POLICY "activity_logs_select_all" ON activity_logs
    FOR SELECT USING (true);

-- Everyone can insert logs
DROP POLICY IF EXISTS "activity_logs_insert_all" ON activity_logs;
CREATE POLICY "activity_logs_insert_all" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- Function to auto-log demand status changes
CREATE OR REPLACE FUNCTION log_demand_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_old_status TEXT;
    v_new_status TEXT;
BEGIN
    -- Get user name from profiles
    SELECT name INTO v_user_name FROM profiles WHERE id = NEW.updated_by;
    
    -- Get status names
    IF OLD.status_id IS NOT NULL THEN
        SELECT name INTO v_old_status FROM statuses WHERE id = OLD.status_id;
    END IF;
    SELECT name INTO v_new_status FROM statuses WHERE id = NEW.status_id;
    
    -- Only log if status actually changed
    IF OLD.status_id IS DISTINCT FROM NEW.status_id AND NEW.updated_by IS NOT NULL THEN
        INSERT INTO activity_logs (
            user_id,
            user_name,
            action,
            action_label,
            entity_type,
            entity_id,
            entity_title,
            old_value,
            new_value,
            metadata
        ) VALUES (
            NEW.updated_by,
            COALESCE(v_user_name, 'Sistema'),
            'status_changed',
            'alterou status',
            'demand',
            NEW.id,
            NEW.title,
            v_old_status,
            v_new_status,
            jsonb_build_object(
                'old_status_id', OLD.status_id,
                'new_status_id', NEW.status_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Trigger for automatic logging (only if demands table has updated_by column)
-- If updated_by column doesn't exist, the trigger won't work automatically
-- You can add it with: ALTER TABLE demands ADD COLUMN updated_by UUID REFERENCES profiles(id);

-- Function to manually log activities (for frontend use via RPC)
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_action TEXT,
    p_action_label TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_entity_title TEXT DEFAULT NULL,
    p_old_value TEXT DEFAULT NULL,
    p_new_value TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_user_name TEXT;
    v_log_id UUID;
BEGIN
    SELECT name INTO v_user_name FROM profiles WHERE id = p_user_id;
    
    INSERT INTO activity_logs (
        user_id,
        user_name,
        action,
        action_label,
        entity_type,
        entity_id,
        entity_title,
        old_value,
        new_value,
        metadata
    ) VALUES (
        p_user_id,
        COALESCE(v_user_name, 'Usuário'),
        p_action,
        p_action_label,
        p_entity_type,
        p_entity_id,
        p_entity_title,
        p_old_value,
        p_new_value,
        p_metadata
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
