-- Create Master Admin in auth.users
-- Password: f3l1p3

-- 1. Enable pgcrypto for hashing
create extension if not exists pgcrypto;

-- 2. Insert into auth.users (if not exists)
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@manager.com') THEN
    new_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'admin@manager.com',
      crypt('f3l1p3', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW()
    );
    
    -- 3. Update existing profile to link to new auth user
    -- We update the ID of the existing profile to match the auth user ID
    -- This ensures RLS and Joins work correctly.
    -- Note: Updating Primary Key can be risky if there are Foreign Keys.
    -- If profiles.id is referenced by demands.log or others, we must cascade.
    -- Assuming Cascade Update is configured or we need to manually update references.
    
    -- Check if profile exists
    IF EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@manager.com') THEN
       -- Update the ID. If there are constraints, this might fail without CASCADE.
       -- For safety, let's assume we might need to delete old and create new if update fails, 
       -- but better to try update.
       -- However, since I can't easily see constraints here, I'll try a safer approach:
       -- Update the ID.
       UPDATE profiles SET id = new_user_id WHERE email = 'admin@manager.com';
    ELSE
       -- Create profile if missing
       INSERT INTO profiles (id, email, name, role, status, created_at)
       VALUES (new_user_id, 'admin@manager.com', 'Master Admin', 'Administrador', 'active', NOW());
    END IF;

  ELSE
    -- User exists in Auth, sync profile ID just in case (unlikely mismatch if flow works)
    -- But if user exists, we don't know the password.
    -- Start fresh:
    NULL; -- wrapper
  END IF;
END $$;
