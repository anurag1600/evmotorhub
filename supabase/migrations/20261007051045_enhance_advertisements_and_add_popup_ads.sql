/*
# Enhance Advertisements System + Add Popup Ads

## Overview
This migration extends the existing `advertisements` table with new columns for title, description, CTA text, custom width/height, priority, and page targeting. It also creates a new `popup_ads` table for popup/modal advertisements with frequency controls, display duration, and page targeting.

## Changes to `advertisements` table (new columns)
- `title` (text, nullable) — display title overlaid on or beside the ad
- `description` (text, nullable) — short description text
- `cta_text` (text, nullable) — call-to-action button label
- `custom_width` (integer, nullable) — custom pixel width for custom-sized ads
- `custom_height` (integer, nullable) — custom pixel height for custom-sized ads
- `priority` (integer, default 0) — higher = shown first
- `page_target` (text, nullable) — comma-separated page slugs/paths where this ad should appear (null = all pages)
- `is_popup` (boolean, default false) — marks this ad as a popup ad (legacy flag, popup_ads table preferred)

## New table: `popup_ads`
- `id` (uuid, primary key)
- `name` (text, not null) — internal name
- `title` (text, nullable) — popup heading
- `description` (text, nullable) — popup body text
- `image_url` (text, nullable) — popup image
- `cta_text` (text, nullable) — button label
- `cta_url` (text, nullable) — button link destination
- `delay_seconds` (integer, default 3) — seconds after page load before popup shows
- `display_duration` (integer, default 10) — seconds the popup stays visible (0 = until closed)
- `frequency` (text, default 'once_per_session') — once_per_visit, once_per_session, once_per_day, once_per_week, always
- `cooldown_minutes` (integer, default 0) — minutes before same popup can show again (0 = no cooldown)
- `page_targets` (text[], nullable) — array of page paths this popup should appear on (null/empty = all pages)
- `exclude_pages` (text[], nullable) — pages where this popup should NOT appear
- `priority` (integer, default 0) — higher = shown first
- `is_active` (boolean, default true)
- `start_date` (date, nullable) — campaign start
- `end_date` (date, nullable) — campaign end
- `impression_count` (integer, default 0)
- `click_count` (integer, default 0)
- `close_button_enabled` (boolean, default true)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

## Security
- `advertisements` already has RLS enabled. Existing policies cover the new columns (they use `*` select / generic insert/update).
- `popup_ads` gets RLS enabled with:
  - Public SELECT: only active popups within date range (anon + authenticated)
  - Admin CRUD: authenticated users full access (4 separate policies)

## Indexes
- `idx_popup_ads_active` on (is_active)
- `idx_advertisements_priority` on (priority)
*/

-- Add new columns to advertisements table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'title') THEN
    ALTER TABLE advertisements ADD COLUMN title text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'description') THEN
    ALTER TABLE advertisements ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'cta_text') THEN
    ALTER TABLE advertisements ADD COLUMN cta_text text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'custom_width') THEN
    ALTER TABLE advertisements ADD COLUMN custom_width integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'custom_height') THEN
    ALTER TABLE advertisements ADD COLUMN custom_height integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'priority') THEN
    ALTER TABLE advertisements ADD COLUMN priority integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'page_target') THEN
    ALTER TABLE advertisements ADD COLUMN page_target text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advertisements' AND column_name = 'is_popup') THEN
    ALTER TABLE advertisements ADD COLUMN is_popup boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add index on priority
CREATE INDEX IF NOT EXISTS idx_advertisements_priority ON advertisements (priority);

-- Create popup_ads table
CREATE TABLE IF NOT EXISTS popup_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text,
  description text,
  image_url text,
  cta_text text,
  cta_url text,
  delay_seconds integer NOT NULL DEFAULT 3,
  display_duration integer NOT NULL DEFAULT 10,
  frequency text NOT NULL DEFAULT 'once_per_session',
  cooldown_minutes integer NOT NULL DEFAULT 0,
  page_targets text[],
  exclude_pages text[],
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  start_date date,
  end_date date,
  impression_count integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,
  close_button_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE popup_ads ENABLE ROW LEVEL SECURITY;

-- Public SELECT: only active popups within date range
DROP POLICY IF EXISTS "public_select_popup_ads" ON popup_ads;
CREATE POLICY "public_select_popup_ads"
ON popup_ads FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND (start_date IS NULL OR start_date <= CURRENT_DATE)
  AND (end_date IS NULL OR end_date >= CURRENT_DATE)
);

-- Admin CRUD policies
DROP POLICY IF EXISTS "admin_select_popup_ads" ON popup_ads;
CREATE POLICY "admin_select_popup_ads"
ON popup_ads FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_insert_popup_ads" ON popup_ads;
CREATE POLICY "admin_insert_popup_ads"
ON popup_ads FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_popup_ads" ON popup_ads;
CREATE POLICY "admin_update_popup_ads"
ON popup_ads FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_popup_ads" ON popup_ads;
CREATE POLICY "admin_delete_popup_ads"
ON popup_ads FOR DELETE
TO authenticated
USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_popup_ads_active ON popup_ads (is_active);
CREATE INDEX IF NOT EXISTS idx_popup_ads_priority ON popup_ads (priority);
