-- EV Pricing Management Overhaul
-- Transform from fixed-amount to percentage-based dynamic pricing

-- ============================================
-- 1. CREATE NEW TABLES
-- ============================================

-- Vehicle categories for tax differentiation
CREATE TYPE vehicle_pricing_category AS ENUM ('electric_car', 'electric_scooter', 'electric_bike');

-- Pricing rules: per-city, per-vehicle-category configuration
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES pricing_cities(id) ON DELETE CASCADE,
  vehicle_category vehicle_pricing_category NOT NULL,
  
  -- RTO / Road Tax percentage
  rto_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Insurance as percentage of ex-showroom
  insurance_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Fixed charges
  registration_fee INTEGER DEFAULT 0,
  hsrp_fee INTEGER DEFAULT 0,
  fastag_fee INTEGER DEFAULT 0,
  other_charges INTEGER DEFAULT 0,
  
  -- Visibility toggles
  show_rto BOOLEAN DEFAULT true,
  show_insurance BOOLEAN DEFAULT true,
  show_registration BOOLEAN DEFAULT true,
  show_hsrp BOOLEAN DEFAULT true,
  show_fastag BOOLEAN DEFAULT true,
  show_other BOOLEAN DEFAULT true,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(city_id, vehicle_category)
);

-- Tax slabs for price-based taxation
CREATE TABLE IF NOT EXISTS pricing_slabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES pricing_rules(id) ON DELETE CASCADE,
  min_price INTEGER NOT NULL DEFAULT 0,
  max_price INTEGER, -- NULL means no upper limit
  tax_percentage DECIMAL(5,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subsidies: can be fixed amount OR percentage
CREATE TYPE subsidy_type AS ENUM ('fixed', 'percentage');

CREATE TABLE IF NOT EXISTS pricing_subsidies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES pricing_cities(id) ON DELETE CASCADE,
  vehicle_category vehicle_pricing_category NOT NULL,
  subsidy_type subsidy_type NOT NULL DEFAULT 'fixed',
  value DECIMAL(12,2) NOT NULL DEFAULT 0, -- Amount in Rs OR percentage
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(city_id, vehicle_category)
);

-- ============================================
-- 2. MODIFY PRICING_CITIES TABLE
-- ============================================

-- Add pincode column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_cities' AND column_name = 'pincode') THEN
    ALTER TABLE pricing_cities ADD COLUMN pincode TEXT;
  END IF;
END $$;

-- Add is_popular column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_cities' AND column_name = 'is_popular') THEN
    ALTER TABLE pricing_cities ADD COLUMN is_popular BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add subsidy_amount to states as default fallback
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_states' AND column_name = 'subsidy_amount') THEN
    ALTER TABLE pricing_states ADD COLUMN subsidy_amount INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pricing_rules_city ON pricing_rules(city_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_category ON pricing_rules(vehicle_category);
CREATE INDEX IF NOT EXISTS idx_pricing_slabs_rule ON pricing_slabs(rule_id);
CREATE INDEX IF NOT EXISTS idx_pricing_subsidies_city ON pricing_subsidies(city_id);

-- ============================================
-- 4. ENABLE RLS
-- ============================================

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_subsidies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pricing_rules
CREATE POLICY "pricing_rules_select" ON pricing_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "pricing_rules_insert" ON pricing_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pricing_rules_update" ON pricing_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pricing_rules_delete" ON pricing_rules FOR DELETE TO authenticated USING (true);

-- RLS Policies for pricing_slabs
CREATE POLICY "pricing_slabs_select" ON pricing_slabs FOR SELECT TO authenticated USING (true);
CREATE POLICY "pricing_slabs_insert" ON pricing_slabs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pricing_slabs_update" ON pricing_slabs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pricing_slabs_delete" ON pricing_slabs FOR DELETE TO authenticated USING (true);

-- RLS Policies for pricing_subsidies
CREATE POLICY "pricing_subsidies_select" ON pricing_subsidies FOR SELECT TO authenticated USING (true);
CREATE POLICY "pricing_subsidies_insert" ON pricing_subsidies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pricing_subsidies_update" ON pricing_subsidies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pricing_subsidies_delete" ON pricing_subsidies FOR DELETE TO authenticated USING (true);

-- ============================================
-- 5. MIGRATE EXISTING DATA TO NEW STRUCTURE
-- ============================================

-- Create default pricing rules for each city + category combination
INSERT INTO pricing_rules (city_id, vehicle_category, rto_percentage, insurance_percentage, registration_fee, hsrp_fee, fastag_fee, other_charges)
SELECT 
  c.id,
  'electric_car'::vehicle_pricing_category,
  COALESCE(s.rto_percentage, 8),
  3.5, -- Default insurance percentage for cars
 1000, -- Registration
  500,  -- HSRP
  500,  -- FASTag
  c.other_charges
FROM pricing_cities c
JOIN pricing_states s ON c.state_id = s.id
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_rules r WHERE r.city_id = c.id AND r.vehicle_category = 'electric_car'
)
ON CONFLICT DO NOTHING;

INSERT INTO pricing_rules (city_id, vehicle_category, rto_percentage, insurance_percentage, registration_fee, hsrp_fee, fastag_fee, other_charges)
SELECT 
  c.id,
  'electric_scooter'::vehicle_pricing_category,
  COALESCE(s.rto_percentage, 6),
  2.5, -- Default insurance percentage for scooters
  500,  -- Registration
  300,  -- HSRP
  0,    -- FASTag (not applicable for scooters)
  500   -- Other
FROM pricing_cities c
JOIN pricing_states s ON c.state_id = s.id
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_rules r WHERE r.city_id = c.id AND r.vehicle_category = 'electric_scooter'
)
ON CONFLICT DO NOTHING;

INSERT INTO pricing_rules (city_id, vehicle_category, rto_percentage, insurance_percentage, registration_fee, hsrp_fee, fastag_fee, other_charges)
SELECT 
  c.id,
  'electric_bike'::vehicle_pricing_category,
  COALESCE(s.rto_percentage, 6),
  2.0, -- Default insurance percentage for bikes
  500,  -- Registration
  300,  -- HSRP
  0,    -- FASTag
  500   -- Other
FROM pricing_cities c
JOIN pricing_states s ON c.state_id = s.id
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_rules r WHERE r.city_id = c.id AND r.vehicle_category = 'electric_bike'
)
ON CONFLICT DO NOTHING;

-- Create default slabs for each rule (example slabs)
INSERT INTO pricing_slabs (rule_id, min_price, max_price, tax_percentage, sort_order)
SELECT 
  r.id,
  0,
  1000000,  -- 0-10L
  r.rto_percentage,
  1
FROM pricing_rules r
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_slabs s WHERE s.rule_id = r.id
);

INSERT INTO pricing_slabs (rule_id, min_price, max_price, tax_percentage, sort_order)
SELECT 
  r.id,
  1000000,
  2500000,  -- 10L-25L
  r.rto_percentage + 2,  -- 2% extra above base
  2
FROM pricing_rules r
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_slabs s WHERE s.rule_id = r.id AND s.min_price = 1000000
);

INSERT INTO pricing_slabs (rule_id, min_price, max_price, tax_percentage, sort_order)
SELECT 
  r.id,
  2500000,
  NULL,  -- 25L+
  r.rto_percentage + 4,  -- 4% extra above base
  3
FROM pricing_rules r
WHERE r.vehicle_category = 'electric_car'
AND NOT EXISTS (
  SELECT 1 FROM pricing_slabs s WHERE s.rule_id = r.id AND s.min_price = 2500000
);

-- ============================================
-- 6. UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_pricing_rules_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pricing_rules_update ON pricing_rules;
CREATE TRIGGER pricing_rules_update BEFORE UPDATE ON pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_pricing_rules_updated_at();

DROP TRIGGER IF EXISTS pricing_slabs_update ON pricing_slabs;
CREATE TRIGGER pricing_slabs_update BEFORE UPDATE ON pricing_slabs
  FOR EACH ROW EXECUTE FUNCTION update_pricing_rules_updated_at();

DROP TRIGGER IF EXISTS pricing_subsidies_update ON pricing_subsidies;
CREATE TRIGGER pricing_subsidies_update BEFORE UPDATE ON pricing_subsidies
  FOR EACH ROW EXECUTE FUNCTION update_pricing_rules_updated_at();

-- ============================================
-- 7. UTILITY FUNCTION: Calculate on-road price
-- ============================================

CREATE OR REPLACE FUNCTION calculate_on_road_price(
  p_ex_showroom INTEGER,
  p_city_id UUID,
  p_vehicle_category vehicle_pricing_category
) RETURNS JSON AS $$
DECLARE
  v_rule RECORD;
  v_slab RECORD;
  v_subsidy RECORD;
  v_rto_amount INTEGER := 0;
  v_insurance_amount INTEGER := 0;
  v_registration_fee INTEGER := 0;
  v_hsrp_fee INTEGER := 0;
  v_fastag_fee INTEGER := 0;
  v_other_charges INTEGER := 0;
  v_subsidy_amount INTEGER := 0;
  v_on_road INTEGER := 0;
  v_tax_percentage DECIMAL(5,2) := 0;
  v_subsidy_description TEXT := NULL;
BEGIN
  -- Get the pricing rule
  SELECT * INTO v_rule 
  FROM pricing_rules 
  WHERE city_id = p_city_id 
    AND vehicle_category = p_vehicle_category 
    AND is_active = true;
  
  IF v_rule IS NULL THEN
    RETURN json_build_object(
      'error', 'No pricing rule found',
      'ex_showroom', p_ex_showroom
    );
  END IF;
  
  -- Find applicable tax slab
  SELECT * INTO v_slab
  FROM pricing_slabs
  WHERE rule_id = v_rule.id
    AND is_active = true
    AND p_ex_showroom >= min_price
    AND (max_price IS NULL OR p_ex_showroom <= max_price)
  ORDER BY sort_order LIMIT 1;
  
  IF v_slab IS NOT NULL THEN
    v_tax_percentage := v_slab.tax_percentage;
  ELSE
    v_tax_percentage := v_rule.rto_percentage;
  END IF;
  
  -- Calculate RTO based on slab or rule percentage
  IF v_rule.show_rto THEN
    v_rto_amount := ROUND(p_ex_showroom * v_tax_percentage / 100);
  END IF;
  
  -- Calculate insurance based on percentage
  IF v_rule.show_insurance THEN
    v_insurance_amount := ROUND(p_ex_showroom * v_rule.insurance_percentage / 100);
  END IF;
  
  -- Fixed charges
  v_registration_fee := CASE WHEN v_rule.show_registration THEN v_rule.registration_fee ELSE 0 END;
  v_hsrp_fee := CASE WHEN v_rule.show_hsrp THEN v_rule.hsrp_fee ELSE 0 END;
  v_fastag_fee := CASE WHEN v_rule.show_fastag THEN v_rule.fastag_fee ELSE 0 END;
  v_other_charges := CASE WHEN v_rule.show_other THEN v_rule.other_charges ELSE 0 END;
  
  -- Check for subsidy
  SELECT * INTO v_subsidy
  FROM pricing_subsidies
  WHERE city_id = p_city_id
    AND vehicle_category = p_vehicle_category
    AND is_active = true;
  
  IF v_subsidy IS NOT NULL THEN
    v_subsidy_description := v_subsidy.description;
    IF v_subsidy.subsidy_type = 'fixed'::subsidy_type THEN
      v_subsidy_amount := v_subsidy.value;
    ELSE
      v_subsidy_amount := ROUND(p_ex_showroom * v_subsidy.value / 100);
    END IF;
  END IF;
  
  -- Calculate on-road price
  v_on_road := p_ex_showroom 
    + v_rto_amount 
    + v_insurance_amount 
    + v_registration_fee 
    + v_hsrp_fee 
    + v_fastag_fee 
    + v_other_charges 
    - v_subsidy_amount;
  
  RETURN json_build_object(
    'ex_showroom', p_ex_showroom,
    'rto', v_rto_amount,
    'rto_percentage', v_tax_percentage,
    'insurance', v_insurance_amount,
    'insurance_percentage', v_rule.insurance_percentage,
    'registration', v_registration_fee,
    'hsrp', v_hsrp_fee,
    'fastag', v_fastag_fee,
    'other', v_other_charges,
    'subsidy', v_subsidy_amount,
    'subsidy_description', v_subsidy_description,
    'on_road', v_on_road,
    'breakdown', json_build_object(
      'show_rto', v_rule.show_rto,
      'show_insurance', v_rule.show_insurance,
      'show_registration', v_rule.show_registration,
      'show_hsrp', v_rule.show_hsrp,
      'show_fastag', v_rule.show_fastag,
      'show_other', v_rule.show_other
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;