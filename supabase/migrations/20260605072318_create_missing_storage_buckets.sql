
-- Create missing storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('vehicles', 'vehicles', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('news', 'news', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('manufacturers', 'manufacturers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('charging-stations', 'charging-stations', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('general', 'general', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for new buckets (allow authenticated uploads)
CREATE POLICY "news_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'news');
CREATE POLICY "news_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'news');
CREATE POLICY "news_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'news');

CREATE POLICY "vehicles_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vehicles');
CREATE POLICY "vehicles_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'vehicles');
CREATE POLICY "vehicles_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'vehicles');

CREATE POLICY "manufacturers_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'manufacturers');
CREATE POLICY "manufacturers_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'manufacturers');
CREATE POLICY "manufacturers_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'manufacturers');

CREATE POLICY "charging_stations_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'charging-stations');
CREATE POLICY "charging_stations_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'charging-stations');
CREATE POLICY "charging_stations_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'charging-stations');

CREATE POLICY "general_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'general');
CREATE POLICY "general_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'general');
CREATE POLICY "general_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'general');
