-- Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    role text NOT NULL,
    resource text NOT NULL, -- 'dashboard', 'demands', 'team', 'reports', 'registers', 'config'
    can_view boolean DEFAULT false,
    can_manage boolean DEFAULT false, -- Create/Edit
    can_delete boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(role, resource)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow public read access" ON public.role_permissions FOR SELECT USING (true);

-- Allow full access to admins/master only (but we'll bootstrap first)
CREATE POLICY "Allow admin write access" ON public.role_permissions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role IN ('admin', 'administrador', 'master') OR profiles.permission_level = '4')
    )
);

-- Seed Default Permissions
-- ADMIN (All Access)
INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete) VALUES
('admin', 'dashboard', true, true, true),
('admin', 'demands', true, true, true),
('admin', 'team', true, true, true),
('admin', 'reports', true, true, true),
('admin', 'registers', true, true, true),
('admin', 'config', true, true, true)
ON CONFLICT (role, resource) DO UPDATE SET can_view=true, can_manage=true, can_delete=true;

-- GERENTE (Dashboard, Demands, Team - View/Manage, No Delete usually? User asked: "Gerente = dashboard, demandas, colcaboradores")
-- Assuming "Gerente" can manage but maybe not delete everything? Or full access to those modules?
-- Let's give full access to allowed modules for now, user can tweak in UI.
INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete) VALUES
('gerente', 'dashboard', true, false, false), -- Dashboard usually readonly
('gerente', 'demands', true, true, true),
('gerente', 'team', true, true, false), -- View/Edit team, no delete?
('gerente', 'reports', false, false, false),
('gerente', 'registers', false, false, false),
('gerente', 'config', false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- COMUM / DESIGNER (Dashboard, Demands - View only? or Manage own? The matrix implies role-based global permissions)
-- "Comum - dasboard e demandas"
INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete) VALUES
('comum', 'dashboard', true, false, false),
('comum', 'demands', true, true, false), -- Can create/edit, no delete
('comum', 'team', false, false, false),
('comum', 'reports', false, false, false),
('comum', 'registers', false, false, false),
('comum', 'config', false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Map other role names to these keys in frontend or duplicate rows
-- Duplicating for robustness
INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete)
SELECT 'master', resource, can_view, can_manage, can_delete FROM public.role_permissions WHERE role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete)
SELECT 'administrador', resource, can_view, can_manage, can_delete FROM public.role_permissions WHERE role = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete)
SELECT 'manager', resource, can_view, can_manage, can_delete FROM public.role_permissions WHERE role = 'gerente'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete)
SELECT 'gestor', resource, can_view, can_manage, can_delete FROM public.role_permissions WHERE role = 'gerente'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete)
SELECT 'user', resource, can_view, can_manage, can_delete FROM public.role_permissions WHERE role = 'comum'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete)
SELECT 'colaborador', resource, can_view, can_manage, can_delete FROM public.role_permissions WHERE role = 'comum'
ON CONFLICT DO NOTHING;
