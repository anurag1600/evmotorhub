-- Create advertisements table
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ad_type TEXT NOT NULL DEFAULT 'banner',
  ad_size TEXT NOT NULL DEFAULT 'rectangle',
  ad_position TEXT NOT NULL DEFAULT 'sidebar',
  image_url TEXT NOT NULL,
  destination_url TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  impression_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- Policies for public read
CREATE POLICY "advertisements_select_policy" ON advertisements FOR SELECT
  USING (is_active = true AND (start_date IS NULL OR start_date <= CURRENT_DATE) AND (end_date IS NULL OR end_date >= CURRENT_DATE));

-- Admin policies
CREATE POLICY "advertisements_admin_select" ON advertisements FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "advertisements_admin_insert" ON advertisements FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "advertisements_admin_update" ON advertisements FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "advertisements_admin_delete" ON advertisements FOR DELETE
  TO authenticated USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_advertisements_position ON advertisements(ad_position);
CREATE INDEX IF NOT EXISTS idx_advertisements_active ON advertisements(is_active);
