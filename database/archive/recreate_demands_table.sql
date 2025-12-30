-- RECREATE DEMANDS TABLE (WITH NAMED CONSTRAINTS)
-- APAGA TUDO E CRIA DE NOVO (Necessário para corrigir a "Ligação Ambígua")

-- 1. Drop tables (CASCADE)
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.demands CASCADE;

-- 2. Create DEMANDS Table (With Explicit Constraint Names)
CREATE TABLE public.demands (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  goal text,
  deadline timestamp with time zone,
  
  -- Classification
  priority text DEFAULT 'Média',
  status_id uuid REFERENCES public.statuses(id) ON DELETE SET NULL,
  type_id uuid REFERENCES public.demand_types(id) ON DELETE SET NULL,
  origin_id uuid REFERENCES public.origins(id) ON DELETE SET NULL,
  
  -- Keys (Explicit Names Needed for API)
  responsible_id uuid CONSTRAINT demands_responsible_id_fkey REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid CONSTRAINT demands_created_by_fkey REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Links
  reference_link text,
  drive_link text,
  
  -- Timer
  production_started_at timestamp with time zone,
  accumulated_time bigint DEFAULT 0,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create COMMENTS Table
CREATE TABLE public.comments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  demand_id uuid REFERENCES public.demands(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Security (RLS)
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 5. Create Permissive Policies (All Access)
CREATE POLICY "Allow All Demands" ON public.demands FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Comments" ON public.comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
