-- Create vehicle_categories table for dynamic homepage categories
CREATE TABLE IF NOT EXISTS vehicle_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image_url text,
  subtitle text,
  link text NOT NULL DEFAULT '/vehicles',
  display_order int DEFAULT 0,
  vehicle_type text CHECK (vehicle_type IN ('scooter', 'bike', 'car')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vehicle categories" ON vehicle_categories
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage vehicle categories" ON vehicle_categories
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ));

INSERT INTO vehicle_categories (name, slug, image_url, subtitle, link, display_order, vehicle_type, is_active)
VALUES
  ('Electric Scooters', 'scooters', 'https://images.pexels.com/photos/11087018/pexels-photo-11087018.jpeg?auto=compress&cs=tinysrgb&w=600', 'City-friendly electric scooters for daily commute', '/vehicles?type=scooter', 1, 'scooter', true),
  ('Electric Bikes', 'bikes', 'https://images.pexels.com/photos/11087017/pexels-photo-11087017.jpeg?auto=compress&cs=tinysrgb&w=600', 'High-performance electric motorcycles', '/vehicles?type=bike', 2, 'bike', true),
  ('Electric Cars', 'cars', 'https://images.pexels.com/photos/12016016/pexels-photo-12016016.jpeg?auto=compress&cs=tinysrgb&w=600', 'Premium electric vehicles for families', '/vehicles?type=car', 3, 'car', true),
  ('Commercial EVs', 'commercial', 'https://images.pexels.com/photos/12016016/pexels-photo-12016016.jpeg?auto=compress&cs=tinysrgb&w=600', 'Commercial electric vehicles for business', '/vehicles?type=commercial', 4, null, true),
  ('Three Wheelers', 'three-wheelers', 'https://images.pexels.com/photos/11087018/pexels-photo-11087018.jpeg?auto=compress&cs=tinysrgb&w=600', 'Electric three-wheelers and autos', '/vehicles?type=three-wheeler', 5, null, true)
ON CONFLICT (slug) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  subtitle = EXCLUDED.subtitle,
  link = EXCLUDED.link,
  display_order = EXCLUDED.display_order;

-- Add variants image_url column if table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicle_variants' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE vehicle_variants ADD COLUMN image_url text;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_vehicle_categories_order ON vehicle_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_vehicle_variants_vehicle ON vehicle_variants(vehicle_id);
