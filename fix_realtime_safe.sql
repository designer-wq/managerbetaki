-- Enable Realtime for key tables (Fail-safe version)
-- This script checks if tables are already added and ignores errors if they are.

DO $$
DECLARE
    tables text[] := ARRAY['demands', 'origins', 'demand_types', 'statuses', 'job_titles', 'app_config', 'profiles'];
    t text;
BEGIN
    FOREACH t IN ARRAY tables LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Table % is already in publication', t;
            WHEN OTHERS THEN
                RAISE NOTICE 'Error adding table %: %', t, SQLERRM;
        END;
    END LOOP;
END $$;
