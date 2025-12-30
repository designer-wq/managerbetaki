-- Create a public bucket for app assets
insert into storage.buckets (id, name, public)
values ('app-assets', 'app-assets', true)
on conflict (id) do nothing;

-- Set up proper RLS for the bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'app-assets' );

create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'app-assets' and auth.role() = 'authenticated' );

create policy "Authenticated Update"
  on storage.objects for update
  using ( bucket_id = 'app-assets' and auth.role() = 'authenticated' );
