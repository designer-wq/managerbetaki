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

-- 6. Ensure RLS policies exist (CRUD per role 'authenticated')

-- Helper: enable RLS and drop previous permissive policies
ALTER TABLE public.origins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON public.origins;
DROP POLICY IF EXISTS "Allow all access" ON public.demand_types;
DROP POLICY IF EXISTS "Allow all access" ON public.statuses;
DROP POLICY IF EXISTS "Allow all access" ON public.permissions;
DROP POLICY IF EXISTS "Allow all access" ON public.demands;
DROP POLICY IF EXISTS "Allow all access" ON public.comments;
DROP POLICY IF EXISTS "Allow all access" ON public.job_titles;
DROP POLICY IF EXISTS "Allow all access" ON public.logs;
DROP POLICY IF EXISTS "Allow all access" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access" ON public.app_config;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.app_config;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.app_config;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='origins') THEN
        DROP POLICY IF EXISTS "origins_select_authenticated" ON public.origins;
        DROP POLICY IF EXISTS "origins_insert_authenticated" ON public.origins;
        DROP POLICY IF EXISTS "origins_update_authenticated" ON public.origins;
        DROP POLICY IF EXISTS "origins_delete_authenticated" ON public.origins;
        EXECUTE 'ALTER TABLE public.origins ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "origins_select_authenticated" ON public.origins FOR SELECT USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "origins_insert_authenticated" ON public.origins FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "origins_update_authenticated" ON public.origins FOR UPDATE USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "origins_delete_authenticated" ON public.origins FOR DELETE USING (auth.role() = ''authenticated'')';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='demand_types') THEN
        DROP POLICY IF EXISTS "demand_types_select_authenticated" ON public.demand_types;
        DROP POLICY IF EXISTS "demand_types_insert_authenticated" ON public.demand_types;
        DROP POLICY IF EXISTS "demand_types_update_authenticated" ON public.demand_types;
        DROP POLICY IF EXISTS "demand_types_delete_authenticated" ON public.demand_types;
        EXECUTE 'ALTER TABLE public.demand_types ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "demand_types_select_authenticated" ON public.demand_types FOR SELECT USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "demand_types_insert_authenticated" ON public.demand_types FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "demand_types_update_authenticated" ON public.demand_types FOR UPDATE USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "demand_types_delete_authenticated" ON public.demand_types FOR DELETE USING (auth.role() = ''authenticated'')';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='statuses') THEN
        DROP POLICY IF EXISTS "statuses_select_authenticated" ON public.statuses;
        DROP POLICY IF EXISTS "statuses_insert_authenticated" ON public.statuses;
        DROP POLICY IF EXISTS "statuses_update_authenticated" ON public.statuses;
        DROP POLICY IF EXISTS "statuses_delete_authenticated" ON public.statuses;
        EXECUTE 'ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "statuses_select_authenticated" ON public.statuses FOR SELECT USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "statuses_insert_authenticated" ON public.statuses FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "statuses_update_authenticated" ON public.statuses FOR UPDATE USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "statuses_delete_authenticated" ON public.statuses FOR DELETE USING (auth.role() = ''authenticated'')';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='permissions') THEN
        DROP POLICY IF EXISTS "permissions_select_authenticated" ON public.permissions;
        DROP POLICY IF EXISTS "permissions_insert_authenticated" ON public.permissions;
        DROP POLICY IF EXISTS "permissions_update_authenticated" ON public.permissions;
        DROP POLICY IF EXISTS "permissions_delete_authenticated" ON public.permissions;
        EXECUTE 'ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "permissions_select_authenticated" ON public.permissions FOR SELECT USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "permissions_insert_authenticated" ON public.permissions FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "permissions_update_authenticated" ON public.permissions FOR UPDATE USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "permissions_delete_authenticated" ON public.permissions FOR DELETE USING (auth.role() = ''authenticated'')';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='demands') THEN
        DROP POLICY IF EXISTS "demands_select_authenticated" ON public.demands;
        DROP POLICY IF EXISTS "demands_insert_authenticated" ON public.demands;
        DROP POLICY IF EXISTS "demands_update_authenticated" ON public.demands;
        DROP POLICY IF EXISTS "demands_delete_authenticated" ON public.demands;
        EXECUTE 'ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "demands_select_authenticated" ON public.demands FOR SELECT USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "demands_insert_authenticated" ON public.demands FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "demands_update_authenticated" ON public.demands FOR UPDATE USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "demands_delete_authenticated" ON public.demands FOR DELETE USING (auth.role() = ''authenticated'')';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='comments') THEN
        DROP POLICY IF EXISTS "comments_select_authenticated" ON public.comments;
        DROP POLICY IF EXISTS "comments_insert_authenticated" ON public.comments;
        DROP POLICY IF EXISTS "comments_update_authenticated" ON public.comments;
        DROP POLICY IF EXISTS "comments_delete_authenticated" ON public.comments;
        EXECUTE 'ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "comments_select_authenticated" ON public.comments FOR SELECT USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "comments_insert_authenticated" ON public.comments FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "comments_update_authenticated" ON public.comments FOR UPDATE USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "comments_delete_authenticated" ON public.comments FOR DELETE USING (auth.role() = ''authenticated'')';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='job_titles') THEN
        DROP POLICY IF EXISTS "job_titles_select_authenticated" ON public.job_titles;
        DROP POLICY IF EXISTS "job_titles_insert_authenticated" ON public.job_titles;
        DROP POLICY IF EXISTS "job_titles_update_authenticated" ON public.job_titles;
        DROP POLICY IF EXISTS "job_titles_delete_authenticated" ON public.job_titles;
        EXECUTE 'ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "job_titles_select_authenticated" ON public.job_titles FOR SELECT USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "job_titles_insert_authenticated" ON public.job_titles FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "job_titles_update_authenticated" ON public.job_titles FOR UPDATE USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "job_titles_delete_authenticated" ON public.job_titles FOR DELETE USING (auth.role() = ''authenticated'')';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='logs') THEN
        DROP POLICY IF EXISTS "logs_select_authenticated" ON public.logs;
        DROP POLICY IF EXISTS "logs_insert_authenticated" ON public.logs;
        DROP POLICY IF EXISTS "logs_update_authenticated" ON public.logs;
        DROP POLICY IF EXISTS "logs_delete_authenticated" ON public.logs;
        EXECUTE 'ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "logs_select_authenticated" ON public.logs FOR SELECT USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "logs_insert_authenticated" ON public.logs FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "logs_update_authenticated" ON public.logs FOR UPDATE USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "logs_delete_authenticated" ON public.logs FOR DELETE USING (auth.role() = ''authenticated'')';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
        DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
        DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
        EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id)';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='app_config') THEN
        DROP POLICY IF EXISTS "app_config_select_public" ON public.app_config;
        DROP POLICY IF EXISTS "app_config_insert_authenticated" ON public.app_config;
        DROP POLICY IF EXISTS "app_config_update_authenticated" ON public.app_config;
        EXECUTE 'ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "app_config_select_public" ON public.app_config FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "app_config_insert_authenticated" ON public.app_config FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "app_config_update_authenticated" ON public.app_config FOR UPDATE USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
    END IF;
END $$;

-- 7. Insert default job titles (ignore if duplicates exist)
INSERT INTO public.job_titles (name) 
SELECT 'Designer' WHERE NOT EXISTS (SELECT 1 FROM public.job_titles WHERE name = 'Designer');
INSERT INTO public.job_titles (name) 
SELECT 'Copywriter' WHERE NOT EXISTS (SELECT 1 FROM public.job_titles WHERE name = 'Copywriter');
INSERT INTO public.job_titles (name) 
SELECT 'Social Media' WHERE NOT EXISTS (SELECT 1 FROM public.job_titles WHERE name = 'Social Media');
INSERT INTO public.job_titles (name) 
SELECT 'Videomaker' WHERE NOT EXISTS (SELECT 1 FROM public.job_titles WHERE name = 'Videomaker');
