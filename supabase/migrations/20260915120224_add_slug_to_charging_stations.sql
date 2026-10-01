/*
# Add slug column to charging_stations

1. Changes
   - Added `slug` column (text, unique) to `charging_stations` for SEO-friendly URLs.
   - Backfilled slugs for all existing stations from their name + city.
   - Added a unique index on `slug` for fast lookups.
2. Security
   - No RLS policy changes — existing public SELECT policy already covers the new column.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'charging_stations' AND column_name = 'slug'
  ) THEN
    ALTER TABLE charging_stations ADD COLUMN slug text;
  END IF;
END $$;

-- Backfill slugs for existing rows that don't have one
UPDATE charging_stations
SET slug = lower(
  regexp_replace(
    trim(coalesce(name, '') || '-' || coalesce(city, '')),
    '[^a-zA-Z0-9]+', '-', 'g'
  )
  || '-' || substring(id::text, 1, 8)
)
WHERE slug IS NULL OR slug = '';

-- Ensure no duplicates after backfill
UPDATE charging_stations s
SET slug = s.slug || '-' || substring(s.id::text, 1, 8)
WHERE EXISTS (
  SELECT 1 FROM charging_stations s2
  WHERE s2.slug = s.slug AND s2.id < s.id
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_charging_stations_slug ON charging_stations (slug);
