/*
  # Create Storage Buckets for Image Management

  1. Storage Buckets
    - vehicles: For vehicle images
    - news: For news article images
    - manufacturers: For brand logos and hero images
    - charging-stations: For charging station images
    - general: For general/miscellaneous images

  2. Configuration
    - All buckets are PUBLIC for reading
    - Authenticated users can upload
    - RLS policies control access

  NOTE: This migration uses SQL to create storage buckets.
  Storage bucket creation requires additional configuration via Supabase UI or API.
  The buckets should be created as PUBLIC with the following RLS policies:
  
  For each bucket:
  - SELECT: Anyone (public read)
  - INSERT: Authenticated users only
  - UPDATE: Authenticated users own files
  - DELETE: Authenticated users own files
*/

-- This is a placeholder migration for documentation
-- Storage buckets should be created via:
-- 1. Supabase Dashboard > Storage > New Bucket
-- 2. Or via Supabase API with service role key

-- When creating buckets, set:
-- Public = ON (allow public read)
-- File size limit = 5MB
-- Allowed MIME types = image/jpeg, image/png, image/webp, image/svg+xml
