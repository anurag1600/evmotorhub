/*
  # Admin Authentication and Settings

  ## Overview
  Create admin user roles, settings tables, and media storage configuration.

  ## New Tables
  - admin_users: Store admin access control
  - seo_settings: Global SEO configuration
  - media_uploads: Track uploaded media

  ## Security
  - RLS policies for admin users only
  - Media uploads linked to authenticated users
*/

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('super_admin', 'editor', 'viewer')),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin users" ON admin_users
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true
  ));

CREATE POLICY "Super admins can manage admin users" ON admin_users
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role = 'super_admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role = 'super_admin'
  ));

-- SEO Settings table
CREATE TABLE IF NOT EXISTS seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL,
  site_description text,
  default_og_image text,
  default_twitter_image text,
  meta_title text,
  meta_description text,
  og_title text,
  og_description text,
  twitter_handle text,
  twitter_card text DEFAULT 'summary_large_image',
  favicon_url text,
  robots_txt text,
  sitemap_url text,
  google_analytics_id text,
  google_search_console_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read SEO settings" ON seo_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update SEO settings" ON seo_settings
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

-- Media uploads tracking table
CREATE TABLE IF NOT EXISTS media_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  original_filename text NOT NULL,
  mime_type text,
  file_size bigint,
  storage_path text NOT NULL,
  file_url text NOT NULL,
  alt_text text,
  description text,
  is_featured boolean DEFAULT false,
  width int,
  height int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view media" ON media_uploads
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload media" ON media_uploads
  FOR INSERT TO authenticated
  WITH CHECK (uploader_id = auth.uid());

CREATE POLICY "Admins can delete media" ON media_uploads
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

-- Index for media queries
CREATE INDEX IF NOT EXISTS idx_media_uploader ON media_uploads(uploader_id);
CREATE INDEX IF NOT EXISTS idx_media_created ON media_uploads(created_at DESC);

-- Insert default SEO settings
INSERT INTO seo_settings (
  site_name,
  site_description,
  meta_title,
  meta_description,
  og_title,
  og_description,
  twitter_handle,
  robots_txt
) VALUES (
  'EVMotorHub',
  'India''s #1 EV Marketplace for electric vehicles',
  'EVMotorHub — India''s #1 EV Marketplace',
  'Compare, research, and buy electric scooters, bikes, and cars in India. Real specs, prices, and reviews.',
  'EVMotorHub — Find Your Perfect Electric Vehicle',
  'Compare 50+ EV scooters, bikes, and cars. Real specs, honest prices, expert reviews.',
  '@EVMotorHub',
  'User-agent: *
Allow: /
Disallow: /admin'
) ON CONFLICT DO NOTHING;
