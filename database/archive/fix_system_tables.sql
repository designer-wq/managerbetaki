-- Script to fix system tables and permissions
-- Run this in the Supabase SQL Editor

-- 0. CLEANUP: Drop Views if they exist (Fixing "cannot alter view" error for origins)
-- We only drop origins as a view because the logs indicated it was a view.
-- For others, we assume they are tables or don't exist yet to avoid "is not a view" errors.
DROP VIEW IF EXISTS public.origins;

-- 1. Origins (Origens)
CREATE TABLE IF NOT EXISTS public.origins (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.origins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON public.origins;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.origins;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.origins;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.origins;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.origins;

CREATE POLICY "Allow all access" ON public.origins FOR ALL USING (true) WITH CHECK (true);


-- 2. Demand Types (Tipos de Demanda)
CREATE TABLE IF NOT EXISTS public.demand_types (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.demand_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON public.demand_types;
CREATE POLICY "Allow all access" ON public.demand_types FOR ALL USING (true) WITH CHECK (true);


-- 3. Statuses (Status)
CREATE TABLE IF NOT EXISTS public.statuses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL,
  -- "order" might be missing in old schema, avoiding error in CREATE if exits
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure 'order' column exists (Schema Migration)
ALTER TABLE public.statuses ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;

ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON public.statuses;
CREATE POLICY "Allow all access" ON public.statuses FOR ALL USING (true) WITH CHECK (true);


-- 4. Job Titles (Cargos)
CREATE TABLE IF NOT EXISTS public.job_titles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON public.job_titles;
CREATE POLICY "Allow all access" ON public.job_titles FOR ALL USING (true) WITH CHECK (true);


-- 5. Insert Default Data (Only if tables are empty)
INSERT INTO public.statuses (name, color, "order")
SELECT 'Backlog', 'bg-zinc-500', 1
WHERE NOT EXISTS (SELECT 1 FROM public.statuses);

INSERT INTO public.statuses (name, color, "order")
SELECT 'Em Produção', 'bg-blue-500', 2
WHERE NOT EXISTS (SELECT 1 FROM public.statuses WHERE name = 'Em Produção');

INSERT INTO public.statuses (name, color, "order")
SELECT 'Revisão', 'bg-yellow-500', 3
WHERE NOT EXISTS (SELECT 1 FROM public.statuses WHERE name = 'Revisão');

INSERT INTO public.statuses (name, color, "order")
SELECT 'Concluído', 'bg-green-500', 4
WHERE NOT EXISTS (SELECT 1 FROM public.statuses WHERE name = 'Concluído');


INSERT INTO public.origins (name)
SELECT 'Instagram'
WHERE NOT EXISTS (SELECT 1 FROM public.origins WHERE name = 'Instagram');

INSERT INTO public.origins (name)
SELECT 'Email'
WHERE NOT EXISTS (SELECT 1 FROM public.origins WHERE name = 'Email');

INSERT INTO public.origins (name)
SELECT 'WhatsApp'
WHERE NOT EXISTS (SELECT 1 FROM public.origins WHERE name = 'WhatsApp');


INSERT INTO public.demand_types (name)
SELECT 'Post'
WHERE NOT EXISTS (SELECT 1 FROM public.demand_types WHERE name = 'Post');

INSERT INTO public.demand_types (name)
SELECT 'Story'
WHERE NOT EXISTS (SELECT 1 FROM public.demand_types WHERE name = 'Story');

INSERT INTO public.demand_types (name)
SELECT 'Reels'
WHERE NOT EXISTS (SELECT 1 FROM public.demand_types WHERE name = 'Reels');

INSERT INTO public.demand_types (name)
SELECT 'Vídeo'
WHERE NOT EXISTS (SELECT 1 FROM public.demand_types WHERE name = 'Vídeo');


INSERT INTO public.job_titles (name)
SELECT 'Designer'
WHERE NOT EXISTS (SELECT 1 FROM public.job_titles WHERE name = 'Designer');

INSERT INTO public.job_titles (name)
SELECT 'Copywriter'
WHERE NOT EXISTS (SELECT 1 FROM public.job_titles WHERE name = 'Copywriter');

INSERT INTO public.job_titles (name)
SELECT 'Social Media'
WHERE NOT EXISTS (SELECT 1 FROM public.job_titles WHERE name = 'Social Media');
