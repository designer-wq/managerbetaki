-- Add all system pages to role_permissions table
-- This includes: dashboard, demands, team, reports, goals, activity_log, registers, config

-- First, add the new resources for existing roles that are missing

-- ADMIN gets full access to all resources (including new ones)
INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete) VALUES
('admin', 'goals', true, true, true),
('admin', 'activity_log', true, true, true)
ON CONFLICT (role, resource) DO UPDATE SET can_view=true, can_manage=true, can_delete=true;

-- GERENTE gets access to goals but limited activity_log
INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete) VALUES
('gerente', 'goals', false, false, false),
('gerente', 'activity_log', false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- DESIGNER permissions for new resources
INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete) VALUES
('designer', 'dashboard', true, false, false),
('designer', 'demands', true, true, false),
('designer', 'team', false, false, false),
('designer', 'reports', false, false, false),
('designer', 'goals', false, false, false),
('designer', 'activity_log', false, false, false),
('designer', 'registers', false, false, false),
('designer', 'config', false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- VISUALIZADOR permissions for all resources (view only dashboard and demands)
INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete) VALUES
('visualizador', 'dashboard', true, false, false),
('visualizador', 'demands', true, false, false),
('visualizador', 'team', false, false, false),
('visualizador', 'reports', false, false, false),
('visualizador', 'goals', false, false, false),
('visualizador', 'activity_log', false, false, false),
('visualizador', 'registers', false, false, false),
('visualizador', 'config', false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- COMUM permissions for new resources
INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete) VALUES
('comum', 'goals', false, false, false),
('comum', 'activity_log', false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Sync alias roles with their base roles for new resources
INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete)
SELECT 'master', resource, can_view, can_manage, can_delete 
FROM public.role_permissions 
WHERE role = 'admin' AND resource IN ('goals', 'activity_log')
ON CONFLICT (role, resource) DO UPDATE SET 
    can_view = EXCLUDED.can_view, 
    can_manage = EXCLUDED.can_manage, 
    can_delete = EXCLUDED.can_delete;

INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete)
SELECT 'administrador', resource, can_view, can_manage, can_delete 
FROM public.role_permissions 
WHERE role = 'admin' AND resource IN ('goals', 'activity_log')
ON CONFLICT (role, resource) DO UPDATE SET 
    can_view = EXCLUDED.can_view, 
    can_manage = EXCLUDED.can_manage, 
    can_delete = EXCLUDED.can_delete;

INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete)
SELECT 'manager', resource, can_view, can_manage, can_delete 
FROM public.role_permissions 
WHERE role = 'gerente' AND resource IN ('goals', 'activity_log')
ON CONFLICT (role, resource) DO UPDATE SET 
    can_view = EXCLUDED.can_view, 
    can_manage = EXCLUDED.can_manage, 
    can_delete = EXCLUDED.can_delete;

INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete)
SELECT 'gestor', resource, can_view, can_manage, can_delete 
FROM public.role_permissions 
WHERE role = 'gerente' AND resource IN ('goals', 'activity_log')
ON CONFLICT (role, resource) DO UPDATE SET 
    can_view = EXCLUDED.can_view, 
    can_manage = EXCLUDED.can_manage, 
    can_delete = EXCLUDED.can_delete;
