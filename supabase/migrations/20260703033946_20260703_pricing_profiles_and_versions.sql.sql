-- Pricing Engine: Create pricing_profiles table (extends pricing_rules concept)
CREATE TABLE IF NOT EXISTS pricing_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  city_id uuid REFERENCES pricing_cities(id) ON DELETE CASCADE,
  vehicle_category text NOT NULL CHECK (vehicle_category IN ('electric_car', 'electric_scooter', 'electric_bike')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Percentage charges
  rto_percentage numeric DEFAULT 0,
  insurance_percentage numeric DEFAULT 0,
  
  -- Fixed charges
  registration_fee integer DEFAULT 0,
  hsrp_fee integer DEFAULT 0,
  fastag_fee integer DEFAULT 0,
  handling_charges integer DEFAULT 0,
  dealer_charges integer DEFAULT 0,
  delivery_charges integer DEFAULT 0,
  accessories_charges integer DEFAULT 0,
  other_charges integer DEFAULT 0,
  misc_charges integer DEFAULT 0,
  
  -- Visibility toggles
  show_rto boolean DEFAULT true,
  show_insurance boolean DEFAULT true,
  show_registration boolean DEFAULT true,
  show_hsrp boolean DEFAULT true,
  show_fastag boolean DEFAULT true,
  show_handling boolean DEFAULT false,
  show_dealer boolean DEFAULT false,
  show_delivery boolean DEFAULT false,
  show_accessories boolean DEFAULT false,
  show_other boolean DEFAULT true,
  show_misc boolean DEFAULT false,
  
  -- Calculation order (JSON array of charge names in order)
  calculation_order jsonb DEFAULT '["rto","insurance","registration","hsrp","fastag","handling","dealer","delivery","accessories","other","misc"]'::jsonb,
  
  -- Rule conditions
  brand_id uuid REFERENCES manufacturers(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES vehicle_variants(id) ON DELETE SET NULL,
  vehicle_type text CHECK (vehicle_type IN ('scooter', 'bike', 'car')),
  battery_min_kwh numeric,
  battery_max_kwh numeric,
  price_range_min integer,
  price_range_max integer,
  priority integer DEFAULT 0,
  effective_date date,
  
  -- Subsidy
  has_subsidy boolean DEFAULT false,
  subsidy_type text DEFAULT 'fixed' CHECK (subsidy_type IN ('fixed', 'percentage')),
  subsidy_value numeric DEFAULT 0,
  subsidy_title text,
  subsidy_badge_text text,
  subsidy_description text,
  subsidy_start_date date,
  subsidy_end_date date,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pricing profile versions for version history
CREATE TABLE IF NOT EXISTS pricing_profile_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES pricing_profiles(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  snapshot jsonb NOT NULL,
  changed_by text,
  change_description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, version_number)
);

-- Tax slabs now reference pricing_profiles instead of pricing_rules
CREATE TABLE IF NOT EXISTS pricing_profile_slabs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES pricing_profiles(id) ON DELETE CASCADE,
  min_price integer NOT NULL,
  max_price integer,
  tax_percentage numeric NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pricing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_profile_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_profile_slabs ENABLE ROW LEVEL SECURITY;

-- RLS policies for pricing_profiles
CREATE POLICY "select_pricing_profiles" ON pricing_profiles FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_pricing_profiles" ON pricing_profiles FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_pricing_profiles" ON pricing_profiles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_pricing_profiles" ON pricing_profiles FOR DELETE
  TO authenticated USING (true);

-- RLS policies for pricing_profile_versions
CREATE POLICY "select_profile_versions" ON pricing_profile_versions FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_profile_versions" ON pricing_profile_versions FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "delete_profile_versions" ON pricing_profile_versions FOR DELETE
  TO authenticated USING (true);

-- RLS policies for pricing_profile_slabs
CREATE POLICY "select_profile_slabs" ON pricing_profile_slabs FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_profile_slabs" ON pricing_profile_slabs FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_profile_slabs" ON pricing_profile_slabs FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_profile_slabs" ON pricing_profile_slabs FOR DELETE
  TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX idx_pricing_profiles_city ON pricing_profiles(city_id);
CREATE INDEX idx_pricing_profiles_category ON pricing_profiles(vehicle_category);
CREATE INDEX idx_pricing_profiles_status ON pricing_profiles(status);
CREATE INDEX idx_pricing_profiles_city_category ON pricing_profiles(city_id, vehicle_category);
CREATE INDEX idx_profile_versions_profile ON pricing_profile_versions(profile_id);
CREATE INDEX idx_profile_slabs_profile ON pricing_profile_slabs(profile_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pricing_profiles_updated_at BEFORE UPDATE ON pricing_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_profile_slabs_updated_at BEFORE UPDATE ON pricing_profile_slabs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();