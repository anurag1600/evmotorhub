/*
# Create homepage_sections table for Homepage Section Manager

1. New Tables
- `homepage_sections`
  - `id` (uuid, primary key)
  - `section_key` (text, unique, not null) — machine-readable key identifying the section (e.g. "hero", "stats", "featured_evs")
  - `section_label` (text, not null) — human-readable display name for admin UI
  - `sort_order` (integer, not null, default 0) — display order on the frontend
  - `is_enabled` (boolean, not null, default true) — whether the section renders on the frontend
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Purpose
- Admin can reorder homepage sections via drag & drop, enable/disable sections, and the frontend renders them in the saved order.
- Header and Footer are NOT managed here — they are always rendered first and last respectively.
- Future sections automatically become manageable by adding a row to this table.

3. Seed Data
- Inserts default rows for all current homepage sections in their current display order:
  hero, stats, categories, ad_below_hero, featured_evs, popular_comparisons, smart_tools, upcoming_evs, manufacturers, latest_news, ev_vs_petrol, ad_before_faq, faq, registration_cta, ad_above_footer

4. Security
- Enable RLS on `homepage_sections`.
- SELECT: TO anon, authenticated (frontend needs to read section order without auth).
- INSERT/UPDATE/DELETE: TO authenticated (admin only).
*/

CREATE TABLE IF NOT EXISTS homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  section_label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

-- SELECT: public read (frontend needs section order)
DROP POLICY IF EXISTS "anon_select_homepage_sections" ON homepage_sections;
CREATE POLICY "anon_select_homepage_sections"
  ON homepage_sections FOR SELECT
  TO anon, authenticated USING (true);

-- INSERT: admin only
DROP POLICY IF EXISTS "authenticated_insert_homepage_sections" ON homepage_sections;
CREATE POLICY "authenticated_insert_homepage_sections"
  ON homepage_sections FOR INSERT
  TO authenticated WITH CHECK (true);

-- UPDATE: admin only
DROP POLICY IF EXISTS "authenticated_update_homepage_sections" ON homepage_sections;
CREATE POLICY "authenticated_update_homepage_sections"
  ON homepage_sections FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- DELETE: admin only
DROP POLICY IF EXISTS "authenticated_delete_homepage_sections" ON homepage_sections;
CREATE POLICY "authenticated_delete_homepage_sections"
  ON homepage_sections FOR DELETE
  TO authenticated USING (true);

-- Seed default sections in current display order
INSERT INTO homepage_sections (section_key, section_label, sort_order, is_enabled) VALUES
  ('hero', 'Hero Section', 1, true),
  ('stats', 'Stats Strip', 2, true),
  ('categories', 'Browse by Category', 3, true),
  ('ad_below_hero', 'Ad — Below Hero', 4, true),
  ('featured_evs', 'Featured EVs', 5, true),
  ('popular_comparisons', 'Popular Comparisons', 6, true),
  ('smart_tools', 'Smart EV Tools', 7, true),
  ('upcoming_evs', 'Upcoming EVs', 8, true),
  ('manufacturers', 'Top Manufacturers', 9, true),
  ('latest_news', 'Latest News & Reviews', 10, true),
  ('ev_vs_petrol', 'EV vs Petrol Comparison', 11, true),
  ('ad_before_faq', 'Ad — Before FAQ', 12, true),
  ('faq', 'FAQ Section', 13, true),
  ('registration_cta', 'Manufacturer Registration CTA', 14, true),
  ('ad_above_footer', 'Ad — Above Footer', 15, true)
ON CONFLICT (section_key) DO NOTHING;

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_homepage_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS homepage_sections_updated_at ON homepage_sections;
CREATE TRIGGER homepage_sections_updated_at
  BEFORE UPDATE ON homepage_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_homepage_sections_updated_at();
