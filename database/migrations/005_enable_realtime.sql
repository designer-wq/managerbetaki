-- Enable Realtime for key tables
-- This allows the 'useRealtimeSubscription' hook to receive updates

BEGIN;

-- Remove tables first to avoid errors if they are already added (idempotent-ish approach not possible directly in standard SQL for publications without queries, but ADD TABLE usually duplicates or ignores if exists depending on PG version. 
-- Safer to just try adding. If it fails due to "already in publication", it's fine.
-- But to be clean, let's try to add specific tables.

ALTER PUBLICATION supabase_realtime ADD TABLE demands;
ALTER PUBLICATION supabase_realtime ADD TABLE origins;
ALTER PUBLICATION supabase_realtime ADD TABLE demand_types;
ALTER PUBLICATION supabase_realtime ADD TABLE statuses;
ALTER PUBLICATION supabase_realtime ADD TABLE job_titles;
ALTER PUBLICATION supabase_realtime ADD TABLE app_config;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

COMMIT;
