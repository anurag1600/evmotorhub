/*
# Create Manufacturer Registration Submissions and Vehicle Bulk Upload Submissions

## Purpose
Allows companies/manufacturers to self-register from the frontend and bulk-upload
their vehicle data. Both submission types go through an Admin review workflow
(pending -> approved/rejected) before becoming publicly visible.
*/

-- ============================================================
-- 1. manufacturer_submissions table
-- ============================================================
CREATE TABLE IF NOT EXISTS manufacturer_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  slug text,
  logo_url text,
  hero_image_url text,
  description text,
  country text DEFAULT 'India',
  founded_year int,
  headquarters text,
  website text,
  total_models int DEFAULT 0,
  contact_person text,
  contact_email text,
  support_phone text,
  address text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_at timestamptz,
  manufacturer_id uuid REFERENCES manufacturers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE manufacturer_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_manufacturer_submissions" ON manufacturer_submissions;
CREATE POLICY "anon_insert_manufacturer_submissions"
  ON manufacturer_submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_select_manufacturer_submissions" ON manufacturer_submissions;
CREATE POLICY "auth_select_manufacturer_submissions"
  ON manufacturer_submissions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_manufacturer_submissions" ON manufacturer_submissions;
CREATE POLICY "auth_update_manufacturer_submissions"
  ON manufacturer_submissions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_manufacturer_submissions" ON manufacturer_submissions;
CREATE POLICY "auth_delete_manufacturer_submissions"
  ON manufacturer_submissions FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 2. vehicle_submissions table
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_submission_id uuid REFERENCES manufacturer_submissions(id) ON DELETE CASCADE,
  company_name text,
  vehicles jsonb NOT NULL DEFAULT '[]'::jsonb,
  validation_errors jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_vehicle_submissions" ON vehicle_submissions;
CREATE POLICY "anon_insert_vehicle_submissions"
  ON vehicle_submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_select_vehicle_submissions" ON vehicle_submissions;
CREATE POLICY "auth_select_vehicle_submissions"
  ON vehicle_submissions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_vehicle_submissions" ON vehicle_submissions;
CREATE POLICY "auth_update_vehicle_submissions"
  ON vehicle_submissions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_vehicle_submissions" ON vehicle_submissions;
CREATE POLICY "auth_delete_vehicle_submissions"
  ON vehicle_submissions FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_manufacturer_submissions_status ON manufacturer_submissions(status);
CREATE INDEX IF NOT EXISTS idx_manufacturer_submissions_created ON manufacturer_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_submissions_status ON vehicle_submissions(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_submissions_manufacturer_submission ON vehicle_submissions(manufacturer_submission_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_submissions_created ON vehicle_submissions(created_at DESC);
