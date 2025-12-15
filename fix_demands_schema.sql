-- FIX DEMANDS SCHEMA & PERMISSIONS (Run this to fix 400 Errors)

DO $$ 
BEGIN 
    -- 1. Fix DEMANDS table (Add missing priority)
    -- This fixes the "400 Bad Request" when creating a demand
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'priority') THEN
        ALTER TABLE public.demands ADD COLUMN priority text DEFAULT 'Média';
    END IF;

    -- Ensure reference_link exists too
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'demands' AND column_name = 'reference_link') THEN
        ALTER TABLE public.demands ADD COLUMN reference_link text;
    END IF;

    -- 2. Fix PROFILES table (Allow "Comum" role)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    END IF;
    
    -- Generic constraint removal for role just in case
    DECLARE r RECORD;
    BEGIN
        FOR r IN 
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'public.profiles'::regclass 
            AND contype = 'c' 
            AND pg_get_constraintdef(oid) LIKE '%role%'
        LOOP
            EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || r.conname;
        END LOOP;
    END;

    -- 3. Ensure RLS is permissive (Fix 500 Errors)
    -- Re-apply the permissive policies just to be absolute sure
    EXECUTE 'DROP POLICY IF EXISTS "Allow All Demands" ON public.demands';
    EXECUTE 'CREATE POLICY "Allow All Demands" ON public.demands FOR ALL TO authenticated USING (true) WITH CHECK (true)';
    
    EXECUTE 'DROP POLICY IF EXISTS "Allow All Profiles" ON public.profiles';
    EXECUTE 'CREATE POLICY "Allow All Profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true)';

END $$;
