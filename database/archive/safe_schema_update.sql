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
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'due_at') THEN
        ALTER TABLE public.demands ADD COLUMN due_at timestamp with time zone;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'priority') THEN
        ALTER TABLE public.demands ADD COLUMN priority smallint;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'status_changed_at') THEN
        ALTER TABLE public.demands ADD COLUMN status_changed_at timestamp with time zone;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'is_internal') THEN
        ALTER TABLE public.demands ADD COLUMN is_internal boolean default false;
    END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.demand_events (
  id uuid default uuid_generate_v4() primary key,
  demand_id uuid references public.demands(id) on delete cascade,
  from_status_id uuid,
  to_status_id uuid,
  changed_by uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
ALTER TABLE public.demand_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demand_events_select_authenticated" ON public.demand_events;
DROP POLICY IF EXISTS "demand_events_insert_authenticated" ON public.demand_events;
DROP POLICY IF EXISTS "demand_events_update_authenticated" ON public.demand_events;
DROP POLICY IF EXISTS "demand_events_delete_authenticated" ON public.demand_events;
CREATE POLICY "demand_events_select_authenticated" ON public.demand_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "demand_events_insert_authenticated" ON public.demand_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "demand_events_update_authenticated" ON public.demand_events FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "demand_events_delete_authenticated" ON public.demand_events FOR DELETE USING (auth.role() = 'authenticated');
CREATE OR REPLACE FUNCTION public.log_demand_status_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.status_id IS DISTINCT FROM OLD.status_id THEN
    INSERT INTO public.demand_events (demand_id, from_status_id, to_status_id, changed_by)
    VALUES (OLD.id, OLD.status_id, NEW.status_id, auth.uid());
    NEW.status_changed_at := timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trigger_demand_status_change ON public.demands;
CREATE TRIGGER trigger_demand_status_change
BEFORE UPDATE ON public.demands
FOR EACH ROW EXECUTE FUNCTION public.log_demand_status_change();
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.demand_events';
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;
DROP FUNCTION IF EXISTS public.kpi_executive(timestamp with time zone, timestamp with time zone);
CREATE OR REPLACE FUNCTION public.kpi_executive(period_start timestamp with time zone, period_end timestamp with time zone)
RETURNS TABLE(
  sla_global numeric,
  lead_time_avg_days numeric,
  lead_time_p90_days numeric,
  lead_time_total_days numeric,
  deliveries_count integer,
  backlog_total integer,
  wip_current integer,
  lead_time_avg_by_type jsonb,
  lead_time_avg_by_designer jsonb
) LANGUAGE sql STABLE AS $$
WITH concluded_period_events AS (
  SELECT DISTINCT e.demand_id AS id
  FROM public.demand_events e
  JOIN public.statuses s ON s.id = e.to_status_id
  WHERE (s."order" = 4 OR lower(s.name) IN ('concluído','concluido'))
    AND e.created_at >= period_start
    AND e.created_at < period_end
),
concluded_period_direct AS (
  SELECT d.id
  FROM public.demands d
  JOIN public.statuses s ON s.id = d.status_id
  WHERE (s."order" = 4 OR lower(s.name) IN ('concluído','concluido'))
    AND NOT EXISTS (SELECT 1 FROM public.demand_events e WHERE e.demand_id = d.id)
    AND COALESCE(d.status_changed_at, timezone('utc'::text, now())) >= period_start
    AND COALESCE(d.status_changed_at, timezone('utc'::text, now())) < period_end
),
first_completed AS (
  SELECT id FROM concluded_period_events
  UNION
  SELECT id FROM concluded_period_direct
),
completed_in_period AS (
  SELECT d.id, d.created_at AS created_at, fc.completed_at AS completed_at, COALESCE(d.due_at, d.deadline) AS due_at
  FROM public.demands d
  JOIN (
    SELECT e.demand_id AS id, MIN(e.created_at) AS completed_at
    FROM public.demand_events e
    JOIN public.statuses s ON s.id = e.to_status_id
    WHERE (s."order" = 4 OR lower(s.name) IN ('concluído','concluido'))
      AND e.demand_id IN (SELECT id FROM first_completed)
      AND e.created_at >= period_start
      AND e.created_at < period_end
    GROUP BY e.demand_id
    UNION
    SELECT d2.id AS id, COALESCE(d2.status_changed_at, timezone('utc'::text, now())) AS completed_at
    FROM public.demands d2
    WHERE d2.id IN (SELECT id FROM first_completed)
      AND NOT EXISTS (SELECT 1 FROM public.demand_events e2 WHERE e2.demand_id = d2.id)
  ) AS fc ON fc.id = d.id
),
sla AS (
  SELECT
    COUNT(*) FILTER (WHERE due_at IS NOT NULL AND completed_at <= due_at) AS within,
    COUNT(*) AS total
  FROM completed_in_period
),
backlog AS (
  SELECT COUNT(*) AS total
  FROM public.demands
  WHERE status_id IN (SELECT id FROM public.statuses WHERE "order" = 1 OR lower(name) IN ('backlog','aprovar'))
),
wip AS (
  SELECT COUNT(*) AS total
  FROM public.demands
  WHERE status_id IN (SELECT id FROM public.statuses WHERE "order" IN (2,3) OR lower(name) IN ('em produção','produção','producao','revisão','revisao'))
),
lead_time_base AS (
  SELECT 
    d.id,
    EXTRACT(EPOCH FROM (c.completed_at - c.created_at)) / 86400.0 AS days,
    COALESCE(d.accumulated_time, 0)::numeric / 86400.0 AS acc_days,
    d.type_id,
    d.responsible_id
  FROM completed_in_period c
  JOIN public.demands d ON d.id = c.id
),
lead_time_by_type AS (
  SELECT 
    COALESCE(dt.name, 'Sem tipo') AS name,
    ROUND(AVG(lt.acc_days)::numeric, 2) AS avg_days,
    ROUND(SUM(lt.acc_days)::numeric, 2) AS total_days,
    COUNT(*) AS deliveries
  FROM lead_time_base lt
  LEFT JOIN public.demand_types dt ON dt.id = lt.type_id
  GROUP BY COALESCE(dt.name, 'Sem tipo')
),
lead_time_by_designer AS (
  SELECT 
    COALESCE(p.name, 'Sem responsável') AS name,
    ROUND(AVG(lt.acc_days)::numeric, 2) AS avg_days,
    ROUND(SUM(lt.acc_days)::numeric, 2) AS total_days,
    COUNT(*) AS deliveries
  FROM lead_time_base lt
  LEFT JOIN public.profiles p ON p.id = lt.responsible_id
  GROUP BY COALESCE(p.name, 'Sem responsável')
)
SELECT
  (SELECT CASE WHEN total = 0 THEN 0 ELSE ROUND((within::numeric / total::numeric) * 100, 2) END FROM sla) AS sla_global,
  COALESCE((SELECT ROUND(AVG(days)::numeric, 2) FROM lead_time_base), 0) AS lead_time_avg_days,
  COALESCE((SELECT ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY days)::numeric, 2) FROM lead_time_base), 0) AS lead_time_p90_days,
  COALESCE((SELECT ROUND(SUM(acc_days)::numeric, 2) FROM lead_time_base), 0) AS lead_time_total_days,
  (SELECT COUNT(*) FROM first_completed) AS deliveries_count,
  (SELECT total FROM backlog) AS backlog_total,
  (SELECT total FROM wip) AS wip_current,
  (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'avg_days', avg_days, 'total_days', total_days, 'deliveries', deliveries) ORDER BY avg_days), '[]'::jsonb) FROM lead_time_by_type) AS lead_time_avg_by_type,
  (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'avg_days', avg_days, 'total_days', total_days, 'deliveries', deliveries) ORDER BY avg_days), '[]'::jsonb) FROM lead_time_by_designer) AS lead_time_avg_by_designer;
$$;
GRANT EXECUTE ON FUNCTION public.kpi_executive(timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kpi_executive(timestamp with time zone, timestamp with time zone) TO service_role;
CREATE OR REPLACE FUNCTION public.executive_insights(period_start timestamp with time zone, period_end timestamp with time zone)
RETURNS TABLE(text text) LANGUAGE sql STABLE AS $$
WITH k AS (
  SELECT * FROM public.kpi_executive(period_start, period_end)
),
total_period AS (
  SELECT COUNT(*) AS total
  FROM public.demands
  WHERE created_at >= period_start AND created_at < period_end
),
type_top AS (
  SELECT dt.name, COUNT(*) AS cnt
  FROM public.demands d
  JOIN public.demand_types dt ON dt.id = d.type_id
  WHERE d.created_at >= period_start AND d.created_at < period_end
  GROUP BY dt.name
  ORDER BY cnt DESC
  LIMIT 1
)
SELECT
  CASE 
    WHEN total_period.total > 0 AND type_top.cnt IS NOT NULL
    THEN 'Tipo ' || type_top.name || ' representam ' || ROUND((type_top.cnt::numeric / total_period.total::numeric) * 100, 0) || '% da capacidade'
    ELSE 'Distribuição por tipo indisponível no período'
  END
FROM total_period, type_top
UNION ALL
SELECT
  CASE 
    WHEN k.lead_time_p90_days > k.lead_time_avg_days * 1.3
    THEN 'Lead time p90 acima da média; atenção ao fluxo'
    ELSE 'Lead time p90 dentro do esperado'
  END
FROM k
UNION ALL
SELECT
  CASE 
    WHEN k.sla_global < 90
    THEN 'SLA abaixo de 90%; revisar prazos e capacidade'
    ELSE 'SLA saudável no período analisado'
  END
FROM k;
$$;
