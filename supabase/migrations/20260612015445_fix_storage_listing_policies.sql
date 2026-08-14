-- Security Fix: Remove broad SELECT policies that allow listing files in public buckets
-- Public buckets can serve files directly via URL without needing list permissions
-- This prevents clients from enumerating all files in storage buckets

-- charging-stations bucket
DROP POLICY IF EXISTS "charging_stations_read" ON storage.objects;

-- general bucket
DROP POLICY IF EXISTS "general_read" ON storage.objects;

-- hero-images bucket
DROP POLICY IF EXISTS "hero_images_read" ON storage.objects;

-- images bucket
DROP POLICY IF EXISTS "Public read images" ON storage.objects;

-- manufacturers bucket
DROP POLICY IF EXISTS "manufacturers_read" ON storage.objects;

-- news bucket
DROP POLICY IF EXISTS "news_read" ON storage.objects;

-- news-images bucket
DROP POLICY IF EXISTS "news_images_read" ON storage.objects;

-- vehicle-gallery bucket
DROP POLICY IF EXISTS "Vehicle gallery read" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_gallery_read" ON storage.objects;

-- vehicles bucket
DROP POLICY IF EXISTS "vehicles_read" ON storage.objects;

-- Only admins can list files in any bucket (for admin panel browsing)
CREATE POLICY "Admins can list all buckets" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
    )
  );
