-- Create pricing configuration tables for on-road price calculation

-- States table
CREATE TABLE IF NOT EXISTS pricing_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  rto_percentage DECIMAL(5,2) DEFAULT 0,
  road_tax_percentage DECIMAL(5,2) DEFAULT 0,
  other_charges INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cities table
CREATE TABLE IF NOT EXISTS pricing_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES pricing_states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rto_charge INTEGER DEFAULT 0,
  insurance_charge INTEGER DEFAULT 0,
  other_charges INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pricing_cities_state ON pricing_cities(state_id);

-- Enable RLS
ALTER TABLE pricing_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_cities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pricing_states
CREATE POLICY "pricing_states_select" ON pricing_states FOR SELECT TO authenticated USING (true);
CREATE POLICY "pricing_states_insert" ON pricing_states FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pricing_states_update" ON pricing_states FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pricing_states_delete" ON pricing_states FOR DELETE TO authenticated USING (true);

-- RLS Policies for pricing_cities
CREATE POLICY "pricing_cities_select" ON pricing_cities FOR SELECT TO authenticated USING (true);
CREATE POLICY "pricing_cities_insert" ON pricing_cities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pricing_cities_update" ON pricing_cities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pricing_cities_delete" ON pricing_cities FOR DELETE TO authenticated USING (true);

-- Insert default states with approximate rates
INSERT INTO pricing_states (name, code, rto_percentage, road_tax_percentage, other_charges) VALUES
('Delhi', 'DL', 8.0, 0, 1000),
('Maharashtra', 'MH', 9.0, 7.0, 2000),
('Karnataka', 'KA', 13.0, 5.0, 1500),
('Tamil Nadu', 'TN', 8.0, 4.0, 1200),
('Gujarat', 'GJ', 6.0, 0, 800),
('Uttar Pradesh', 'UP', 8.0, 0, 1000),
('West Bengal', 'WB', 6.0, 0, 1200),
('Rajasthan', 'RJ', 8.0, 0, 800),
('Telangana', 'TS', 12.0, 7.0, 1500),
('Kerala', 'KL', 6.0, 4.0, 1000),
('Haryana', 'HR', 7.0, 0, 1200),
('Punjab', 'PB', 8.0, 0, 1000)
ON CONFLICT (code) DO NOTHING;

-- Insert default cities
INSERT INTO pricing_cities (state_id, name, rto_charge, insurance_charge, other_charges)
SELECT s.id, 'New Delhi', 50000, 15000, 2000 FROM pricing_states s WHERE s.code = 'DL'
UNION ALL
SELECT s.id, 'Mumbai', 80000, 20000, 3000 FROM pricing_states s WHERE s.code = 'MH'
UNION ALL
SELECT s.id, 'Pune', 60000, 18000, 2500 FROM pricing_states s WHERE s.code = 'MH'
UNION ALL
SELECT s.id, 'Bangalore', 75000, 17000, 2800 FROM pricing_states s WHERE s.code = 'KA'
UNION ALL
SELECT s.id, 'Chennai', 65000, 16000, 2200 FROM pricing_states s WHERE s.code = 'TN'
UNION ALL
SELECT s.id, 'Ahmedabad', 45000, 14000, 1800 FROM pricing_states s WHERE s.code = 'GJ'
UNION ALL
SELECT s.id, 'Noida', 55000, 15000, 2000 FROM pricing_states s WHERE s.code = 'UP'
UNION ALL
SELECT s.id, 'Kolkata', 50000, 15500, 2100 FROM pricing_states s WHERE s.code = 'WB'
UNION ALL
SELECT s.id, 'Jaipur', 42000, 13500, 1700 FROM pricing_states s WHERE s.code = 'RJ'
UNION ALL
SELECT s.id, 'Hyderabad', 70000, 18500, 2600 FROM pricing_states s WHERE s.code = 'TS';

-- Add admin activity logging for pricing
CREATE OR REPLACE FUNCTION log_pricing_activity() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_activity_log (action, entity_type, entity_id, details)
  VALUES (
    CASE WHEN TG_OP = 'INSERT' THEN 'create'
         WHEN TG_OP = 'UPDATE' THEN 'update'
         WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    json_build_object('name', COALESCE(NEW.name, OLD.name))
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for activity logging
DROP TRIGGER IF EXISTS pricing_states_activity ON pricing_states;
CREATE TRIGGER pricing_states_activity AFTER INSERT OR UPDATE OR DELETE ON pricing_states
  FOR EACH ROW EXECUTE FUNCTION log_pricing_activity();

DROP TRIGGER IF EXISTS pricing_cities_activity ON pricing_cities;
CREATE TRIGGER pricing_cities_activity AFTER INSERT OR UPDATE OR DELETE ON pricing_cities
  FOR EACH ROW EXECUTE FUNCTION log_pricing_activity();