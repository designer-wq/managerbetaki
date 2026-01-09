-- Create passwords table for password manager
CREATE TABLE IF NOT EXISTS passwords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    login TEXT NOT NULL,
    password TEXT NOT NULL,
    url TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    purchase_date DATE,
    renewal_date DATE,
    cost DECIMAL(10,2) DEFAULT 0,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type TEXT CHECK (recurrence_type IN ('monthly', 'yearly', 'quarterly', 'one-time')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can do everything
CREATE POLICY "Admin users can do everything with passwords"
    ON passwords
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND LOWER(profiles.role) IN ('admin', 'administrador', 'master')
        )
    );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS passwords_created_by_idx ON passwords(created_by);
CREATE INDEX IF NOT EXISTS passwords_is_active_idx ON passwords(is_active);
CREATE INDEX IF NOT EXISTS passwords_renewal_date_idx ON passwords(renewal_date);

-- Add comment to table
COMMENT ON TABLE passwords IS 'Stores password records for the password manager (admin only access)';
