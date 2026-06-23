-- Create offer_enquiries table
CREATE TABLE IF NOT EXISTS offer_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_name TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  pincode TEXT,
  vehicle_price INTEGER,
  variant_name TEXT,
  message TEXT,
  ip_address TEXT,
  ip_city TEXT,
  ip_state TEXT,
  ip_country TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE offer_enquiries ENABLE ROW LEVEL SECURITY;

-- Admin policies for offer_enquiries
CREATE POLICY "admin_select_offer_enquiries" ON offer_enquiries FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "admin_insert_offer_enquiries" ON offer_enquiries FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "admin_update_offer_enquiries" ON offer_enquiries FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "admin_delete_offer_enquiries" ON offer_enquiries FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Allow public to submit offer enquiries (from frontend)
CREATE POLICY "public_insert_offer_enquiries" ON offer_enquiries FOR INSERT
  TO public WITH CHECK (true);

-- Extend pricing_cities with more fields
ALTER TABLE pricing_cities ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE pricing_cities ADD COLUMN IF NOT EXISTS state_code TEXT;
ALTER TABLE pricing_cities ADD COLUMN IF NOT EXISTS ex_showroom_price_modifier NUMERIC DEFAULT 0;
ALTER TABLE pricing_cities ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;

-- Create index for faster city/pincode search
CREATE INDEX IF NOT EXISTS idx_pricing_cities_name ON pricing_cities (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_pricing_cities_pincode ON pricing_cities (pincode);
CREATE INDEX IF NOT EXISTS idx_pricing_cities_search ON pricing_cities (LOWER(name), pincode);

-- Create index for offer_enquiries
CREATE INDEX IF NOT EXISTS idx_offer_enquiries_vehicle ON offer_enquiries (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_offer_enquiries_status ON offer_enquiries (status);
CREATE INDEX IF NOT EXISTS idx_offer_enquiries_created ON offer_enquiries (created_at DESC);

-- Seed popular Indian cities with pincode data
INSERT INTO pricing_cities (state_id, name, pincode, rto_charge, insurance_charge, other_charges, is_active, is_popular)
SELECT 
  ps.id,
  city.name,
  city.pincode,
  city.rto_charge,
  city.insurance_charge,
  city.other_charges,
  true,
  true
FROM pricing_states ps
CROSS JOIN (
  VALUES
    ('Delhi', '110001', 50000, 15000, 2000),
    ('New Delhi', '110002', 50000, 15000, 2000),
    ('Mumbai', '400001', 55000, 18000, 2500),
    ('Pune', '411001', 48000, 14000, 2000),
    ('Bengaluru', '560001', 52000, 16000, 2200),
    ('Chennai', '600001', 45000, 13500, 1800),
    ('Hyderabad', '500001', 50000, 15000, 2000),
    ('Ahmedabad', '380001', 42000, 12500, 1500),
    ('Kolkata', '700001', 48000, 14500, 2000),
    ('Jaipur', '302001', 40000, 12000, 1500),
    ('Lucknow', '226001', 38000, 11000, 1200),
    ('Chandigarh', '160001', 45000, 13500, 1800),
    ('Noida', '201301', 50000, 15000, 2000),
    ('Gurgaon', '122001', 52000, 15500, 2200),
    ('Gurugram', '122002', 52000, 15500, 2200),
    ('Indore', '452001', 35000, 10000, 1200),
    ('Bhopal', '462001', 36000, 11000, 1300),
    ('Coimbatore', '641001', 42000, 12500, 1600),
    ('Mysore', '570001', 40000, 12000, 1500),
    ('Nagpur', '440001', 38000, 11500, 1400),
    ('Surat', '395001', 44000, 13000, 1700),
    ('Vadodara', '390001', 43000, 12800, 1650),
    ('Visakhapatnam', '530001', 40000, 12000, 1500),
    ('Thane', '400601', 55000, 17800, 2400),
    ('Faridabad', '121001', 48000, 14500, 1900),
    ('Ghaziabad', '201001', 49000, 14800, 2000),
    ('Patna', '800001', 32000, 9500, 1000),
    ('Ranchi', '834001', 34000, 10000, 1100),
    ('Bhubaneswar', '751001', 35000, 10500, 1200),
    ('Guwahati', '781001', 36000, 10800, 1300),
    ('Ludhiana', '141001', 44000, 13200, 1700),
    ('Agra', '282001', 38000, 11500, 1400),
    ('Nashik', '422001', 45000, 13500, 1800),
    ('Vijayawada', '520001', 38000, 11500, 1400),
    ('Kochi', '682001', 42000, 12600, 1600),
    ('Trivandrum', '695001', 40000, 12000, 1500),
    ('Madurai', '625001', 38000, 11400, 1400)
) AS city(name, pincode, rto_charge, insurance_charge, other_charges)
WHERE ps.code = CASE city.name
  WHEN 'Delhi' THEN 'DL'
  WHEN 'New Delhi' THEN 'DL'
  WHEN 'Mumbai' THEN 'MH'
  WHEN 'Pune' THEN 'MH'
  WHEN 'Thane' THEN 'MH'
  WHEN 'Nagpur' THEN 'MH'
  WHEN 'Nashik' THEN 'MH'
  WHEN 'Bengaluru' THEN 'KA'
  WHEN 'Mysore' THEN 'KA'
  WHEN 'Chennai' THEN 'TN'
  WHEN 'Coimbatore' THEN 'TN'
  WHEN 'Madurai' THEN 'TN'
  WHEN 'Hyderabad' THEN 'TG'
  WHEN 'Ahmedabad' THEN 'GJ'
  WHEN 'Surat' THEN 'GJ'
  WHEN 'Vadodara' THEN 'GJ'
  WHEN 'Kolkata' THEN 'WB'
  WHEN 'Jaipur' THEN 'RJ'
  WHEN 'Lucknow' THEN 'UP'
  WHEN 'Noida' THEN 'UP'
  WHEN 'Ghaziabad' THEN 'UP'
  WHEN 'Agra' THEN 'UP'
  WHEN 'Chandigarh' THEN 'CH'
  WHEN 'Gurgaon' THEN 'HR'
  WHEN 'Gurugram' THEN 'HR'
  WHEN 'Faridabad' THEN 'HR'
  WHEN 'Indore' THEN 'MP'
  WHEN 'Bhopal' THEN 'MP'
  WHEN 'Patna' THEN 'BR'
  WHEN 'Ranchi' THEN 'JH'
  WHEN 'Bhubaneswar' THEN 'OD'
  WHEN 'Guwahati' THEN 'AS'
  WHEN 'Ludhiana' THEN 'PB'
  WHEN 'Vijayawada' THEN 'AP'
  WHEN 'Visakhapatnam' THEN 'AP'
  WHEN 'Kochi' THEN 'KL'
  WHEN 'Trivandrum' THEN 'KL'
END
ON CONFLICT DO NOTHING;

-- Update existing popular cities
UPDATE pricing_cities SET is_popular = true, pincode = COALESCE(pincode, 
  CASE 
    WHEN LOWER(name) = 'delhi' THEN '110001'
    WHEN LOWER(name) = 'mumbai' THEN '400001'
    WHEN LOWER(name) = 'pune' THEN '411001'
    WHEN LOWER(name) = 'bengaluru' OR LOWER(name) = 'bangalore' THEN '560001'
    WHEN LOWER(name) = 'chennai' THEN '600001'
    WHEN LOWER(name) = 'hyderabad' THEN '500001'
    WHEN LOWER(name) = 'ahmedabad' THEN '380001'
    WHEN LOWER(name) = 'kolkata' THEN '700001'
    WHEN LOWER(name) = 'jaipur' THEN '302001'
    WHEN LOWER(name) = 'lucknow' THEN '226001'
    WHEN LOWER(name) = 'chandigarh' THEN '160001'
    WHEN LOWER(name) = 'noida' THEN '201301'
    WHEN LOWER(name) = 'gurgaon' OR LOWER(name) = 'gurugram' THEN '122001'
    ELSE pincode
  END
)
WHERE LOWER(name) IN ('delhi', 'mumbai', 'pune', 'bengaluru', 'bangalore', 'chennai', 'hyderabad', 'ahmedabad', 'kolkata', 'jaipur', 'lucknow', 'chandigarh', 'noida', 'gurgaon', 'gurugram');
