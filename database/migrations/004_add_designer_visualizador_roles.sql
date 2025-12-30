-- Add designer and visualizador roles to permissions table
-- This migration adds the missing roles that appear in the PermissionSettings UI

-- DESIGNER role (similar to comum, but typically dedicated to design work)
INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete) VALUES
('designer', 'dashboard', true, false, false),
('designer', 'demands', true, true, false), -- Can view and manage demands
('designer', 'team', false, false, false),
('designer', 'reports', false, false, false),
('designer', 'registers', false, false, false),
('designer', 'config', false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- VISUALIZADOR role (read-only access to dashboard and demands)
INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete) VALUES
('visualizador', 'dashboard', true, false, false),
('visualizador', 'demands', true, false, false), -- View only, no edit/delete
('visualizador', 'team', false, false, false),
('visualizador', 'reports', false, false, false),
('visualizador', 'registers', false, false, false),
('visualizador', 'config', false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Also add common aliases
INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete)
SELECT 'viewer', resource, can_view, can_manage, can_delete FROM public.role_permissions WHERE role = 'visualizador'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, resource, can_view, can_manage, can_delete)
SELECT 'design', resource, can_view, can_manage, can_delete FROM public.role_permissions WHERE role = 'designer'
ON CONFLICT DO NOTHING;
