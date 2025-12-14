-- Safe schema update script
-- Run this in the Supabase SQL Editor to ensure your database is up to date without errors.

-- 1. Create logs table (if not exists)
CREATE TABLE IF NOT EXISTS public.logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create job_titles table (if not exists)
CREATE TABLE IF NOT EXISTS public.job_titles (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create comments table (if not exists)
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid default uuid_generate_v4() primary key,
  demand_id uuid references public.demands(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Add reference_link to demands (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'reference_link') THEN
        ALTER TABLE public.demands ADD COLUMN reference_link text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'production_started_at') THEN
        ALTER TABLE public.demands ADD COLUMN production_started_at timestamp with time zone;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'accumulated_time') THEN
        ALTER TABLE public.demands ADD COLUMN accumulated_time bigint default 0;
    END IF;
END $$;

-- 5. Add job_title_id to profiles (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'job_title_id') THEN
        ALTER TABLE public.profiles ADD COLUMN job_title_id uuid references public.job_titles(id) on delete set null;
    END IF;
END $$;

-- 6. Ensure RLS policies exist (Drop and Recreate to be safe)
-- Demands
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.demands;
CREATE POLICY "Allow all access" ON public.demands FOR ALL USING (true);

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.profiles;
CREATE POLICY "Allow all access" ON public.profiles FOR ALL USING (true);

-- Comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.comments;
CREATE POLICY "Allow all access" ON public.comments FOR ALL USING (true);

-- Job Titles
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.job_titles;
CREATE POLICY "Allow all access" ON public.job_titles FOR ALL USING (true);

-- Logs
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.logs;
CREATE POLICY "Allow all access" ON public.logs FOR ALL USING (true);

-- 7. Insert default job titles (ignore if duplicates exist)
INSERT INTO public.job_titles (name) 
SELECT 'Designer' WHERE NOT EXISTS (SELECT 1 FROM public.job_titles WHERE name = 'Designer');
INSERT INTO public.job_titles (name) 
SELECT 'Copywriter' WHERE NOT EXISTS (SELECT 1 FROM public.job_titles WHERE name = 'Copywriter');
INSERT INTO public.job_titles (name) 
SELECT 'Social Media' WHERE NOT EXISTS (SELECT 1 FROM public.job_titles WHERE name = 'Social Media');
INSERT INTO public.job_titles (name) 
SELECT 'Videomaker' WHERE NOT EXISTS (SELECT 1 FROM public.job_titles WHERE name = 'Videomaker');
