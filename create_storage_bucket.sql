-- Create the storage bucket 'app-assets' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access (so everyone can see the logo)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'app-assets' );

-- Allow Authenticated Users to Upload (INSERT)
CREATE POLICY "Authenticated Users Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'app-assets' );

-- Allow Authenticated Users to Update (UPDATE)
CREATE POLICY "Authenticated Users Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'app-assets' );

-- Allow Authenticated Users to Delete (DELETE)
CREATE POLICY "Authenticated Users Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'app-assets' );
