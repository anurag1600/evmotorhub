/*
  # Create Hero Slides and Static Pages Tables

  ## Hero Slides
  - `hero_slides` table for dynamic homepage carousel
  - Fields: title, subtitle, description, cta_button_text, cta_button_url, image_url, order, is_active, created_at, updated_at
  - RLS: Public read, admin write

  ## Static Pages  
  - `static_pages` table for CMS content (About, Contact, Privacy, Terms, Disclaimer)
  - Fields: slug, title, content, seo_title, seo_description, is_active, created_at, updated_at
  - RLS: Public read, admin write
  
  ## Changes
  - New tables with proper structure
  - RLS policies for public access and admin management
  - Indexes on slug and is_active for performance
*/

-- Hero Slides Table
CREATE TABLE IF NOT EXISTS hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text,
  cta_button_text text,
  cta_button_url text,
  image_url text NOT NULL,
  "order" integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Static Pages Table
CREATE TABLE IF NOT EXISTS static_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  seo_title text,
  seo_description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_pages ENABLE ROW LEVEL SECURITY;

-- Hero Slides Policies
CREATE POLICY "Public read hero slides" ON hero_slides
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admin manage hero slides" ON hero_slides
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role IN ('super_admin', 'editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role IN ('super_admin', 'editor')));

-- Static Pages Policies
CREATE POLICY "Public read static pages" ON static_pages
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admin manage static pages" ON static_pages
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role IN ('super_admin', 'editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role IN ('super_admin', 'editor')));

-- Indexes
CREATE INDEX hero_slides_order_idx ON hero_slides ("order" ASC);
CREATE INDEX hero_slides_active_idx ON hero_slides (is_active);
CREATE INDEX static_pages_slug_idx ON static_pages (slug);
CREATE INDEX static_pages_active_idx ON static_pages (is_active);
