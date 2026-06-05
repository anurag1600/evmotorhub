/*
  # Create Compare Entries Table

  1. New Table
    - `compare_entries` - Entries for vehicle comparison section

  2. Schema
    - id: UUID primary key
    - title: Entry title
    - slug: URL-friendly slug
    - image_url: Featured image
    - description: Entry description
    - comparison_data: JSON object with comparison points
    - status: draft | published | archived
    - created_at, updated_at: Timestamps

  3. Security
    - RLS enabled: Public read published, admin full access
*/

CREATE TABLE IF NOT EXISTS compare_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  image_url text,
  description text,
  comparison_data jsonb DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE compare_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published comparisons"
  ON compare_entries FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Admins can view all comparisons"
  ON compare_entries FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can create comparisons"
  ON compare_entries FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can update comparisons"
  ON compare_entries FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can delete comparisons"
  ON compare_entries FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX IF NOT EXISTS idx_compare_slug ON compare_entries(slug);
CREATE INDEX IF NOT EXISTS idx_compare_status ON compare_entries(status);
CREATE INDEX IF NOT EXISTS idx_compare_updated ON compare_entries(updated_at DESC);
