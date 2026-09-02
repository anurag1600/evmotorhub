
-- Create advertisements storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'advertisements',
  'advertisements',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Create policies for advertisements bucket
DO $$
BEGIN
  -- INSERT policy (authenticated users can upload)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'advertisements_upload') THEN
    CREATE POLICY "advertisements_upload" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'advertisements');
  END IF;

  -- SELECT policy (public can read via URL)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'advertisements_read') THEN
    CREATE POLICY "advertisements_read" ON storage.objects
      FOR SELECT TO anon, authenticated
      USING (bucket_id = 'advertisements');
  END IF;

  -- DELETE policy (authenticated can delete)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'advertisements_delete') THEN
    CREATE POLICY "advertisements_delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'advertisements');
  END IF;

  -- UPDATE policy (authenticated can update)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'advertisements_update') THEN
    CREATE POLICY "advertisements_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'advertisements')
      WITH CHECK (bucket_id = 'advertisements');
  END IF;
END $$;
