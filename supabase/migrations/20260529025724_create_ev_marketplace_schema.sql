/*
  # EVMotorHub - EV Marketplace Schema

  ## Overview
  Complete database schema for the EVMotorHub India EV marketplace platform.

  ## New Tables

  ### 1. manufacturers
  - `id` (uuid, PK) - Unique identifier
  - `name` (text) - Manufacturer name
  - `slug` (text, unique) - URL-friendly name
  - `logo_url` (text) - Logo image URL
  - `hero_image_url` (text) - Hero/banner image
  - `description` (text) - Detailed description
  - `country` (text) - Country of origin
  - `founded_year` (int) - Year founded
  - `headquarters` (text) - HQ location
  - `website` (text) - Official website
  - `total_models` (int) - Number of models
  - `is_featured` (bool) - Featured on homepage

  ### 2. vehicles
  - `id` (uuid, PK) - Unique identifier
  - `name` (text) - Vehicle name
  - `slug` (text, unique) - URL-friendly name
  - `manufacturer_id` (uuid, FK) - Linked manufacturer
  - `type` (text) - scooter/bike/car
  - `segment` (text) - budget/mid/premium/luxury
  - `price_min` (numeric) - Starting price in INR
  - `price_max` (numeric) - Max variant price
  - `range_km` (int) - Range per charge in km
  - `top_speed_kmh` (int) - Top speed
  - `charging_time_hrs` (numeric) - Full charge time
  - `battery_capacity_kwh` (numeric) - Battery size
  - `motor_power_kw` (numeric) - Motor power
  - `image_url` (text) - Main image
  - `gallery_urls` (text[]) - Multiple images
  - `is_upcoming` (bool) - Upcoming launch
  - `is_featured` (bool) - Featured listing
  - `is_latest` (bool) - New arrival
  - `launch_date` (date) - Launch/expected date
  - `colors` (text[]) - Available colors
  - `specifications` (jsonb) - Full spec sheet
  - `features` (jsonb) - Features list
  - `pros` (text[]) - Pros
  - `cons` (text[]) - Cons
  - `created_at` (timestamptz)

  ### 3. news
  - `id` (uuid, PK)
  - `title` (text) - Article title
  - `slug` (text, unique) - URL slug
  - `content` (text) - Full HTML content
  - `excerpt` (text) - Short summary
  - `image_url` (text) - Cover image
  - `published_at` (timestamptz) - Publish date
  - `category` (text) - news/review/launch/comparison
  - `author` (text) - Author name
  - `author_image` (text) - Author avatar
  - `tags` (text[]) - Article tags
  - `read_time_mins` (int) - Estimated read time
  - `is_featured` (bool) - Featured article

  ### 4. charging_stations
  - `id` (uuid, PK)
  - `name` (text) - Station name
  - `address` (text) - Full address
  - `city` (text) - City
  - `state` (text) - State
  - `lat` (numeric) - Latitude
  - `lng` (numeric) - Longitude
  - `operator` (text) - Station operator
  - `connector_types` (text[]) - Connector types
  - `total_chargers` (int) - Total units
  - `available_chargers` (int) - Currently available
  - `status` (text) - active/inactive/coming_soon
  - `power_kw` (numeric) - Charging power
  - `amenities` (text[]) - Nearby amenities
  - `operating_hours` (text) - Hours of operation

  ## Security
  - RLS enabled on all tables
  - Public read access for all tables (marketplace is public)
  - No write access for anonymous users
*/

-- Manufacturers table
CREATE TABLE IF NOT EXISTS manufacturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text DEFAULT '',
  hero_image_url text DEFAULT '',
  description text DEFAULT '',
  country text DEFAULT 'India',
  founded_year int,
  headquarters text DEFAULT '',
  website text DEFAULT '',
  total_models int DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view manufacturers"
  ON manufacturers FOR SELECT
  TO anon, authenticated
  USING (true);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  manufacturer_id uuid REFERENCES manufacturers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('scooter', 'bike', 'car')),
  segment text DEFAULT 'mid' CHECK (segment IN ('budget', 'mid', 'premium', 'luxury')),
  price_min numeric NOT NULL DEFAULT 0,
  price_max numeric NOT NULL DEFAULT 0,
  range_km int DEFAULT 0,
  top_speed_kmh int DEFAULT 0,
  charging_time_hrs numeric DEFAULT 0,
  battery_capacity_kwh numeric DEFAULT 0,
  motor_power_kw numeric DEFAULT 0,
  image_url text DEFAULT '',
  gallery_urls text[] DEFAULT '{}',
  is_upcoming boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  is_latest boolean DEFAULT false,
  launch_date date,
  colors text[] DEFAULT '{}',
  specifications jsonb DEFAULT '{}',
  features jsonb DEFAULT '[]',
  pros text[] DEFAULT '{}',
  cons text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vehicles"
  ON vehicles FOR SELECT
  TO anon, authenticated
  USING (true);

-- News/Blog table
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text DEFAULT '',
  excerpt text DEFAULT '',
  image_url text DEFAULT '',
  published_at timestamptz DEFAULT now(),
  category text DEFAULT 'news' CHECK (category IN ('news', 'review', 'launch', 'comparison', 'guide')),
  author text DEFAULT 'EVMotorHub Team',
  author_image text DEFAULT '',
  tags text[] DEFAULT '{}',
  read_time_mins int DEFAULT 5,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view news"
  ON news FOR SELECT
  TO anon, authenticated
  USING (true);

-- Charging stations table
CREATE TABLE IF NOT EXISTS charging_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  lat numeric,
  lng numeric,
  operator text DEFAULT '',
  connector_types text[] DEFAULT '{}',
  total_chargers int DEFAULT 0,
  available_chargers int DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'coming_soon')),
  power_kw numeric DEFAULT 0,
  amenities text[] DEFAULT '{}',
  operating_hours text DEFAULT '24/7',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE charging_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view charging stations"
  ON charging_stations FOR SELECT
  TO anon, authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_manufacturer ON vehicles(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_featured ON vehicles(is_featured);
CREATE INDEX IF NOT EXISTS idx_vehicles_upcoming ON vehicles(is_upcoming);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_charging_city ON charging_stations(city);
CREATE INDEX IF NOT EXISTS idx_charging_state ON charging_stations(state);
