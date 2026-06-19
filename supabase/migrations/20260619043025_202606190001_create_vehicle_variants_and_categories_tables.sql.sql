-- Vehicle Variants Table
CREATE TABLE IF NOT EXISTS vehicle_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  price INR NOT NULL,
  range_km INTEGER,
  battery_capacity_kwh DECIMAL(10,2),
  motor_power_kw DECIMAL(10,2),
  top_speed_kmh INTEGER,
  charging_time_hrs DECIMAL(5,2),
  image_url TEXT,
  color VARCHAR(100),
  color_hex VARCHAR(7),
  specifications JSONB DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, slug)
);

-- Homepage Categories Table
CREATE TABLE IF NOT EXISTS homepage_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  image_url TEXT NOT NULL,
  link_url VARCHAR(500) NOT NULL,
  vehicle_type VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EV vs Petrol Comparison Settings (add to site_config)
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS ev_petrol_comparison JSONB DEFAULT '{}';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_variants_vehicle_id ON vehicle_variants(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_homepage_categories_sort_order ON homepage_categories(sort_order);

-- Enable RLS
ALTER TABLE vehicle_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicle_variants
CREATE POLICY "public_select_variants" ON vehicle_variants FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "admin_all_variants" ON vehicle_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for homepage_categories  
CREATE POLICY "public_select_categories" ON homepage_categories FOR SELECT TO PUBLIC USING (is_active = true);
CREATE POLICY "admin_all_categories" ON homepage_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_vehicle_variants_updated_at ON vehicle_variants;
CREATE TRIGGER update_vehicle_variants_updated_at BEFORE UPDATE ON vehicle_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_homepage_categories_updated_at ON homepage_categories;
CREATE TRIGGER update_homepage_categories_updated_at BEFORE UPDATE ON homepage_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default categories
INSERT INTO homepage_categories (title, subtitle, image_url, link_url, vehicle_type, sort_order) VALUES
('Electric Scooters', 'Best for city commute', 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=400', '/vehicles?type=scooter', 'scooter', 1),
('Electric Bikes', 'Performance meets efficiency', 'https://images.pexels.com/photos/1544463/pexels-photo-1544463.jpeg?auto=compress&cs=tinysrgb&w=400', '/vehicles?type=bike', 'bike', 2),
('Electric Cars', 'Family & long-distance EVs', 'https://images.pexels.com/photos/3422964/pexels-photo-3422964.jpeg?auto=compress&cs=tinysrgb&w=400', '/vehicles?type=car', 'car', 3)
ON CONFLICT DO NOTHING;

-- Update types.ts comment
COMMENT ON TABLE vehicle_variants IS 'Vehicle variants like Ola S1 Pro, S1 Air, S1 X etc.';
COMMENT ON TABLE homepage_categories IS 'Dynamic categories shown on homepage - manageable from admin';
