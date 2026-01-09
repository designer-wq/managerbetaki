-- Create Master Admin User
-- User: admin@manager.com (or just 'admin' if you use username, but system seems email based)
-- Password: f3l1p3

INSERT INTO profiles (email, name, password, role, status, created_at, updated_at)
VALUES (
  'admin@manager.com',
  'Master Admin',
  'f3l1p3',
  'Administrador',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'Administrador', 
  password = 'f3l1p3',
  status = 'active';

-- Also ensure permissions exist for minimal access if needed, 
-- but Admins bypass permissions check in code (isAdmin check).
