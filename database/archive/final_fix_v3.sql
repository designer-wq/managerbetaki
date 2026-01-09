-- FINAL FIX V3 (THE "NUCLEAR" OPTION)
-- Run this in Supabase SQL Editor to fix 400 Errors (Missing Columns)
-- This script ensures EVERY column used by the Create Demand Form exists.

-- 1. Core Fields
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS goal text;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS deadline timestamp with time zone;

-- 2. New Fields (that were missing earlier)
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Média';
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS reference_link text;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS drive_link text;

-- 3. Timer Fields
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS production_started_at timestamp with time zone;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS accumulated_time bigint DEFAULT 0;

-- 4. Foreign Keys (ID columns)
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS origin_id uuid REFERENCES public.origins(id) ON DELETE SET NULL;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS type_id uuid REFERENCES public.demand_types(id) ON DELETE SET NULL;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS status_id uuid REFERENCES public.statuses(id) ON DELETE SET NULL;
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS responsible_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. User & Job Title Fixes (Just in case)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title_id uuid REFERENCES public.job_titles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 6. Reset Permissions (Fix 500 Errors)
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Demands" ON public.demands;
CREATE POLICY "Allow All Demands" ON public.demands FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Profiles" ON public.profiles;
CREATE POLICY "Allow All Profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
