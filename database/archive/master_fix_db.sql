-- MASTER FIX SCRIPT (FINAL VERSION V3 - INCLUDES PRIORITY FIX)
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. ADD COLUMN 'job_title_id' to profiles if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'job_title_id') THEN
        ALTER TABLE public.profiles ADD COLUMN job_title_id uuid REFERENCES public.job_titles(id) ON DELETE SET NULL;
    END IF;

    -- 2. ADD COLUMN 'priority' to demands (Fixes 400 Error on Create Demand)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'priority') THEN
        ALTER TABLE public.demands ADD COLUMN priority text DEFAULT 'Média';
    END IF;

    -- 3. REMOVE CHECK CONSTRAINTS ON 'ROLE' (Fixes "COMUM" role error)
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.profiles'::regclass 
        AND contype = 'c' 
        AND pg_get_constraintdef(oid) LIKE '%role%'
    LOOP
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || r.conname;
    END LOOP;

    -- 4. DYNAMICALLY DROP ALL RLS POLICIES (Fixes Infinite Recursion 500 Error)
    FOR r IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('profiles', 'app_config', 'demands') 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;

-- 5. RE-ENABLE RLS & CREATE PERMISSIVE POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow All Profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Config" ON public.app_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Demands" ON public.demands FOR ALL TO authenticated USING (true) WITH CHECK (true);
