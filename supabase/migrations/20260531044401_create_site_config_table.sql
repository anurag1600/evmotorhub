/*
  # Create Site Configuration Table

  1. New Table
    - `site_config` - For managing global site settings and hardcoded content

  2. Schema
    - id: UUID primary key
    - homepage_stats: JSON {total_vehicles, total_manufacturers, total_charging_stations, monthly_visitors}
    - category_descriptions: JSON object of category descriptions
    - tools_descriptions: JSON object for tools section
    - benefits: JSON array of why EVMotorHub benefits
    - indian_cities: JSON array of city names for filtering
    - connector_types: JSON array of connector type options
    - bank_rates: JSON array of {bank_name, rate}
    - updated_at: Last update timestamp

  3. Security
    - RLS enabled: Public read, admin write
*/

CREATE TABLE IF NOT EXISTS site_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homepage_stats jsonb DEFAULT '{
    "total_vehicles": 50,
    "total_manufacturers": 8,
    "total_charging_stations": 12000,
    "monthly_visitors": 2000000
  }',
  category_descriptions jsonb DEFAULT '{}',
  tools_descriptions jsonb DEFAULT '{}',
  benefits jsonb DEFAULT '[]',
  indian_cities jsonb DEFAULT '[]',
  connector_types jsonb DEFAULT '["CCS2", "Type 2", "AC Charger"]',
  bank_rates jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site config"
  ON site_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update site config"
  ON site_config FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

-- Insert default site config
INSERT INTO site_config (
  homepage_stats,
  category_descriptions,
  tools_descriptions,
  benefits,
  indian_cities,
  bank_rates
) VALUES (
  '{
    "total_vehicles": 50,
    "total_manufacturers": 8,
    "total_charging_stations": 12000,
    "monthly_visitors": 2000000
  }',
  '{
    "scooters": "Lightweight, affordable, perfect for daily commutes in cities.",
    "bikes": "High-performance electric motorcycles for enthusiasts.",
    "cars": "Family-sized EVs with long range and advanced features."
  }',
  '{
    "compare": "Compare specs, prices, and features side-by-side.",
    "emi": "Calculate monthly EMI for your dream EV.",
    "stations": "Find nearby charging stations and compare facilities."
  }',
  '[
    "Real-time pricing and availability",
    "Expert reviews and comparisons",
    "Find charging stations near you",
    "EMI calculator with all major banks"
  ]',
  '[
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad",
    "Surat", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal"
  ]',
  '[
    {"bank_name": "ICICI Bank", "rate": 9.5},
    {"bank_name": "HDFC Bank", "rate": 8.5},
    {"bank_name": "Axis Bank", "rate": 9.0},
    {"bank_name": "State Bank of India", "rate": 7.5},
    {"bank_name": "IDBI Bank", "rate": 8.75},
    {"bank_name": "Bajaj Finance", "rate": 10.5}
  ]'
) ON CONFLICT DO NOTHING;
