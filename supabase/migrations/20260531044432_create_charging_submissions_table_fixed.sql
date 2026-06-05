/*
  # Create Charging Station Submissions Table (Fixed)

  1. New Table
    - `charging_submissions` - User-submitted charging stations pending admin review

  2. Schema
    - id: UUID primary key
    - name: Station name
    - address: Full address
    - city, state: Location
    - lat, lng: Coordinates
    - operator: Operator name
    - connector_types: Available connectors
    - phone: Contact number
    - status: pending | approved | rejected
    - rejection_reason: Why it was rejected
    - submitted_by: User email who submitted
    - created_at: Submission date

  3. Security
    - RLS enabled: Public can insert, admin can read/update/delete
*/

CREATE TABLE IF NOT EXISTS charging_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  lat numeric,
  lng numeric,
  operator text NOT NULL,
  connector_types text[] DEFAULT '{}',
  phone text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_by text NOT NULL,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id)
);

ALTER TABLE charging_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit charging station"
  ON charging_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view submissions"
  ON charging_submissions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can update submissions"
  ON charging_submissions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can delete submissions"
  ON charging_submissions FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX IF NOT EXISTS idx_charging_submissions_status ON charging_submissions(status);
CREATE INDEX IF NOT EXISTS idx_charging_submissions_created ON charging_submissions(created_at DESC);
