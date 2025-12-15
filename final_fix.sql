-- FINAL FIX (SIMPLE VERSION)
-- Run these lines in Supabase SQL Editor to fix the 400 Error

-- 1. Add "priority" column (Fixes Create Demand error)
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Média';

-- 2. Add "reference_link" column (Just in case it's missing)
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS reference_link text;

-- 3. Add "job_title_id" to users (Fixes User Save error)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title_id uuid REFERENCES public.job_titles(id) ON DELETE SET NULL;

-- 4. Remove limits on User roles (Fixes "Comum" role error)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_fkey;

-- 5. Permission Reset (Fixes 500 Errors)
-- Run these one by one if the block fails, or all together.
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.demands;
DROP POLICY IF EXISTS "Allow All Demands" ON public.demands;
CREATE POLICY "Allow All Demands" ON public.demands FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.profiles;
DROP POLICY IF EXISTS "Allow All Profiles" ON public.profiles;
CREATE POLICY "Allow All Profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
