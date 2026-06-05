INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('hero-images', 'hero-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('vehicle-gallery', 'vehicle-gallery', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('news-images', 'news-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Policies for hero-images
CREATE POLICY "hero_images_upload" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'hero-images');
CREATE POLICY "hero_images_read" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'hero-images');
CREATE POLICY "hero_images_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'hero-images');
CREATE POLICY "hero_images_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'hero-images');

-- Policies for vehicle-gallery
CREATE POLICY "vehicle_gallery_upload" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'vehicle-gallery');
CREATE POLICY "vehicle_gallery_read" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'vehicle-gallery');
CREATE POLICY "vehicle_gallery_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'vehicle-gallery');
CREATE POLICY "vehicle_gallery_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'vehicle-gallery');

-- Policies for news-images
CREATE POLICY "news_images_upload" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'news-images');
CREATE POLICY "news_images_read" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'news-images');
CREATE POLICY "news_images_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'news-images');
CREATE POLICY "news_images_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'news-images');
