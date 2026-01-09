-- FINAL FIX V4 (CREATED_BY SAFETY NET)
-- Run this in Supabase SQL Editor to fix the "created_by" error

-- 1. Make 'created_by' nullable (Safety net)
-- If the column exists, we remove the NOT NULL constraint so it doesn't block saving
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'created_by') THEN
        ALTER TABLE public.demands ALTER COLUMN created_by DROP NOT NULL;
    END IF;
END $$;

-- 2. Ensure all other columns exist (Recap of V3)
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS deadline timestamp with time zone;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Média';
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS reference_link text;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS accumulated_time bigint DEFAULT 0;

-- 3. Reset Permissions (Recap)
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Demands" ON public.demands;
CREATE POLICY "Allow All Demands" ON public.demands FOR ALL TO authenticated USING (true) WITH CHECK (true);
