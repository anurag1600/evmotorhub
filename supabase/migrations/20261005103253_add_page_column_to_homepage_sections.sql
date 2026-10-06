-- Add page column to homepage_sections to support multi-page section management
ALTER TABLE homepage_sections ADD COLUMN IF NOT EXISTS page text NOT NULL DEFAULT 'homepage';

-- Update existing rows to be scoped to 'homepage'
UPDATE homepage_sections SET page = 'homepage' WHERE page IS NULL OR page = '';

-- Add index for page-scoped queries
CREATE INDEX IF NOT EXISTS idx_homepage_sections_page_sort ON homepage_sections(page, sort_order);

-- Drop old unique constraint and add new composite unique constraint
ALTER TABLE homepage_sections DROP CONSTRAINT IF EXISTS homepage_sections_section_key_key;
ALTER TABLE homepage_sections ADD CONSTRAINT homepage_sections_page_section_key UNIQUE (page, section_key);

-- Seed charging station listing page sections
INSERT INTO homepage_sections (page, section_key, section_label, sort_order, is_enabled) VALUES
  ('charging_stations', 'cs_header', 'Charging Stations Header', 1, true),
  ('charging_stations', 'cs_stats', 'Station Stats', 2, true),
  ('charging_stations', 'cs_search', 'Search & Filters', 3, true),
  ('charging_stations', 'cs_stations', 'Station Listings', 4, true),
  ('charging_stations', 'cs_ad_mid', 'Mid-Page Ad', 5, true),
  ('charging_stations', 'cs_submit_cta', 'Submit Station CTA', 6, true)
ON CONFLICT (page, section_key) DO NOTHING;

-- Seed charging station detail page sections
INSERT INTO homepage_sections (page, section_key, section_label, sort_order, is_enabled) VALUES
  ('charging_station_detail', 'csd_header', 'Station Header', 1, true),
  ('charging_station_detail', 'csd_map', 'Map & Directions', 2, true),
  ('charging_station_detail', 'csd_details', 'Station Details', 3, true),
  ('charging_station_detail', 'csd_ad_sidebar', 'Sidebar Ad', 4, true),
  ('charging_station_detail', 'csd_nearby', 'Nearby Stations', 5, true),
  ('charging_station_detail', 'csd_news', 'EV News', 6, true),
  ('charging_station_detail', 'csd_evs', 'Popular EVs', 7, true),
  ('charging_station_detail', 'csd_ad_bottom', 'Bottom Ad', 8, true)
ON CONFLICT (page, section_key) DO NOTHING;
