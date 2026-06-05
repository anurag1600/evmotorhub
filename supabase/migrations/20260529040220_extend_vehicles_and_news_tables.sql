/*
  # Extend vehicles and news tables with admin fields

  ## Overview
  Add fields for draft status, SEO, and variants to existing tables.

  ## Changes
  - Add status, SEO fields to vehicles and news
  - Create variants table for vehicles
  - Add publishing workflow support
*/

-- Add status and SEO fields to vehicles if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'status'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'));
    ALTER TABLE vehicles ADD COLUMN seo_title text;
    ALTER TABLE vehicles ADD COLUMN seo_description text;
    ALTER TABLE vehicles ADD COLUMN seo_keywords text[] DEFAULT '{}';
    ALTER TABLE vehicles ADD COLUMN updated_at timestamptz DEFAULT now();
    ALTER TABLE vehicles ADD COLUMN created_by uuid REFERENCES auth.users(id);
    ALTER TABLE vehicles ADD COLUMN updated_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add status and SEO fields to news if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news' AND column_name = 'status'
  ) THEN
    ALTER TABLE news ADD COLUMN status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'));
    ALTER TABLE news ADD COLUMN seo_title text;
    ALTER TABLE news ADD COLUMN seo_description text;
    ALTER TABLE news ADD COLUMN seo_keywords text[] DEFAULT '{}';
    ALTER TABLE news ADD COLUMN updated_at timestamptz DEFAULT now();
    ALTER TABLE news ADD COLUMN created_by uuid REFERENCES auth.users(id);
    ALTER TABLE news ADD COLUMN updated_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Vehicle variants table
CREATE TABLE IF NOT EXISTS vehicle_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  variant_name text NOT NULL,
  description text,
  price numeric NOT NULL,
  battery_capacity_kwh numeric,
  range_km int,
  color text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vehicle variants" ON vehicle_variants
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage vehicle variants" ON vehicle_variants
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX IF NOT EXISTS idx_variants_vehicle ON vehicle_variants(vehicle_id);

-- Create indexes for status and SEO
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
