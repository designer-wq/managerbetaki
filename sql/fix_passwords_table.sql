-- Se a tabela já existe mas falta colunas, execute estes comandos:

-- Adicionar colunas que podem estar faltando
ALTER TABLE passwords ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE passwords ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE passwords ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE passwords ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE passwords ADD COLUMN IF NOT EXISTS recurrence_type TEXT;
ALTER TABLE passwords ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE passwords ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE passwords ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE passwords ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE passwords ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Criar índices (só se não existirem)
CREATE INDEX IF NOT EXISTS passwords_created_by_idx ON passwords(created_by);
CREATE INDEX IF NOT EXISTS passwords_is_active_idx ON passwords(is_active);
CREATE INDEX IF NOT EXISTS passwords_renewal_date_idx ON passwords(renewal_date);

-- Verificar se a policy já existe, se não, criar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'passwords' AND policyname = 'Admin users can do everything with passwords'
    ) THEN
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
    END IF;
END $$;
