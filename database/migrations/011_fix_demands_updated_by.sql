-- Migration: Fix demands table - Add updated_by column
-- This column is required for the activity logging trigger

-- Add updated_by column to demands table
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_demands_updated_by ON public.demands(updated_by);

-- Optionally, create the trigger if it doesn't exist
-- First, drop if exists to avoid conflicts
DROP TRIGGER IF EXISTS trigger_log_demand_status_change ON public.demands;

-- Create the trigger for logging status changes
CREATE TRIGGER trigger_log_demand_status_change
    AFTER UPDATE ON public.demands
    FOR EACH ROW
    WHEN (OLD.status_id IS DISTINCT FROM NEW.status_id)
    EXECUTE FUNCTION log_demand_status_change();
