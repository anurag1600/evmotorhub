/*
  # Configure Storage Policies for Images Bucket

  1. Policies
    - Public read: Anyone can view images
    - Authenticated upload: Logged-in users can upload
    - Authenticated update: Logged-in users can update
*/

-- Allow public read access
CREATE POLICY "Public read images" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

-- Allow authenticated users to update
CREATE POLICY "Authenticated update images" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');
