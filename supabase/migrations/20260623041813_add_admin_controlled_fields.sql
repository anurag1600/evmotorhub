-- Add show_on_homepage to manufacturers
ALTER TABLE manufacturers 
ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT true;

-- Add admin-controlled related content to vehicles
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS related_news_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS similar_vehicle_ids UUID[] DEFAULT '{}';

-- Add pincode to pricing_cities for search
ALTER TABLE pricing_cities 
ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);

-- Create index for pincode search
CREATE INDEX IF NOT EXISTS idx_pricing_cities_pincode ON pricing_cities(pincode) WHERE pincode IS NOT NULL;

-- Add subsidy field to pricing_states
ALTER TABLE pricing_states
ADD COLUMN IF NOT EXISTS subsidy_amount INTEGER DEFAULT 0;

-- Update existing cities with pincodes
UPDATE pricing_cities SET pincode = '110001' WHERE name = 'New Delhi' AND pincode IS NULL;
UPDATE pricing_cities SET pincode = '122001' WHERE name = 'Gurgaon' AND pincode IS NULL;
UPDATE pricing_cities SET pincode = '201301' WHERE name = 'Noida' AND pincode IS NULL;
UPDATE pricing_cities SET pincode = '560001' WHERE name = 'Bangalore' AND pincode IS NULL;
UPDATE pricing_cities SET pincode = '400001' WHERE name = 'Mumbai' AND pincode IS NULL;
UPDATE pricing_cities SET pincode = '411001' WHERE name = 'Pune' AND pincode IS NULL;
UPDATE pricing_cities SET pincode = '500001' WHERE name = 'Hyderabad' AND pincode IS NULL;
UPDATE pricing_cities SET pincode = '600001' WHERE name = 'Chennai' AND pincode IS NULL;

-- Seed additional popular cities
INSERT INTO pricing_cities (id, state_id, name, pincode, rto_charge, insurance_charge, other_charges, is_active)
SELECT gen_random_uuid(), s.id, 'Gurgaon', '122001', 8000, 12000, 1500, true
FROM pricing_states s WHERE s.code = 'HR' AND NOT EXISTS (SELECT 1 FROM pricing_cities WHERE name = 'Gurgaon');

INSERT INTO pricing_cities (id, state_id, name, pincode, rto_charge, insurance_charge, other_charges, is_active)
SELECT gen_random_uuid(), s.id, 'Noida', '201301', 8500, 11000, 1500, true
FROM pricing_states s WHERE s.code = 'UP' AND NOT EXISTS (SELECT 1 FROM pricing_cities WHERE name = 'Noida');

INSERT INTO pricing_cities (id, state_id, name, pincode, rto_charge, insurance_charge, other_charges, is_active)
SELECT gen_random_uuid(), s.id, 'Bangalore', '560001', 9000, 13000, 2000, true
FROM pricing_states s WHERE s.code = 'KA' AND NOT EXISTS (SELECT 1 FROM pricing_cities WHERE name = 'Bangalore');

INSERT INTO pricing_cities (id, state_id, name, pincode, rto_charge, insurance_charge, other_charges, is_active)
SELECT gen_random_uuid(), s.id, 'Mumbai', '400001', 10000, 14000, 2500, true
FROM pricing_states s WHERE s.code = 'MH' AND NOT EXISTS (SELECT 1 FROM pricing_cities WHERE name = 'Mumbai');

INSERT INTO pricing_cities (id, state_id, name, pincode, rto_charge, insurance_charge, other_charges, is_active)
SELECT gen_random_uuid(), s.id, 'Pune', '411001', 9500, 12500, 2000, true
FROM pricing_states s WHERE s.code = 'MH' AND NOT EXISTS (SELECT 1 FROM pricing_cities WHERE name = 'Pune');

INSERT INTO pricing_cities (id, state_id, name, pincode, rto_charge, insurance_charge, other_charges, is_active)
SELECT gen_random_uuid(), s.id, 'Hyderabad', '500001', 8500, 12000, 1800, true
FROM pricing_states s WHERE s.code = 'TS' AND NOT EXISTS (SELECT 1 FROM pricing_cities WHERE name = 'Hyderabad');

INSERT INTO pricing_cities (id, state_id, name, pincode, rto_charge, insurance_charge, other_charges, is_active)
SELECT gen_random_uuid(), s.id, 'Chennai', '600001', 8000, 11500, 1500, true
FROM pricing_states s WHERE s.code = 'TN' AND NOT EXISTS (SELECT 1 FROM pricing_cities WHERE name = 'Chennai');