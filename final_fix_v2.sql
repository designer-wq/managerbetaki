-- FINAL FIX V2 (INCLUDES TIMER COLUMNS)
-- Run this in Supabase SQL Editor to fix the 400 Error

-- 1. Add "priority" column
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Média';

-- 2. Add "reference_link" column
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS reference_link text;

-- 3. Add "drive_link" column (Just in case)
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS drive_link text;

-- 4. Add TIMER COLUMNS (This fixes the new error you saw)
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS accumulated_time bigint DEFAULT 0;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS production_started_at timestamp with time zone;

-- 5. Add "job_title_id" to users (For User Save error)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title_id uuid REFERENCES public.job_titles(id) ON DELETE SET NULL;

-- 6. Remove limits on User roles (For "Comum" role error)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 7. Reset Policies (For 500 Errors)
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Demands" ON public.demands;
CREATE POLICY "Allow All Demands" ON public.demands FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Profiles" ON public.profiles;
CREATE POLICY "Allow All Profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
