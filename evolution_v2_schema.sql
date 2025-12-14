-- Evolution 2.0 Schema Update
-- Adds Priority and Capacity fields to support new decision-making features.

-- 1. Add 'priority' to 'demands' table
-- Values recommended: 'Alta', 'Média', 'Baixa'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'priority') THEN
        ALTER TABLE public.demands ADD COLUMN priority text DEFAULT 'Média';
    END IF;
END $$;

-- 2. Add 'weekly_capacity' to 'profiles' table
-- Default capacity set to 10 demands per week
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'weekly_capacity') THEN
        ALTER TABLE public.profiles ADD COLUMN weekly_capacity integer DEFAULT 10;
    END IF;
END $$;
