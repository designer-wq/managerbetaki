-- Fix RLS for app_config to allow anonymous access
alter table public.app_config enable row level security;

-- Drop existing restrictive policies to avoid conflicts
drop policy if exists "Allow public read access" on public.app_config;
drop policy if exists "Allow authenticated update" on public.app_config;
drop policy if exists "Allow authenticated insert" on public.app_config;

-- Create permissive policies for app_config
create policy "Allow all access" on public.app_config for all using (true);

-- Fix RLS for Storage (app-assets bucket)
-- We need to ensure the bucket exists and policies allow anon uploads
insert into storage.buckets (id, name, public)
values ('app-assets', 'app-assets', true)
on conflict (id) do nothing;

-- Drop existing storage policies for this bucket
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;
drop policy if exists "Authenticated Update" on storage.objects;
drop policy if exists "Allow all app-assets" on storage.objects;

-- Create new permissive policy for app-assets
create policy "Allow all app-assets"
on storage.objects for all
using ( bucket_id = 'app-assets' )
with check ( bucket_id = 'app-assets' );
