-- Create app_config table for global settings
CREATE TABLE IF NOT EXISTS public.app_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key text NOT NULL UNIQUE,
    value text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Insert default logo if not exists
INSERT INTO public.app_config (key, value)
VALUES ('app_logo', 'https://picsum.photos/100/100?random=1')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access" ON public.app_config FOR SELECT USING (true);

-- Allow write access to authenticated users (or restrict to admins later)
CREATE POLICY "Allow authenticated update" ON public.app_config FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON public.app_config FOR INSERT WITH CHECK (auth.role() = 'authenticated');
