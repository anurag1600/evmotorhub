/*
  # Create Footer Configuration Table

  1. New Table
    - `footer_config` - For managing footer content and links

  2. Schema
    - id: UUID primary key
    - company_description: About company text for footer
    - social_links: JSON array of {platform, url, icon}
    - footer_menu: JSON array of {title, href, target}
    - contact_info: JSON object {email, phone, address}
    - copyright_text: Copyright notice
    - is_active: Whether to show footer
    - created_at, updated_at: Timestamps

  3. Security
    - RLS enabled: Public read, admin write
    - Single record table (only one footer config)
*/

CREATE TABLE IF NOT EXISTS footer_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_description text,
  social_links jsonb DEFAULT '[]',
  footer_menu jsonb DEFAULT '[]',
  contact_info jsonb DEFAULT '{}',
  copyright_text text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE footer_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view footer config"
  ON footer_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update footer config"
  ON footer_config FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

-- Insert default footer config
INSERT INTO footer_config (
  company_description,
  copyright_text,
  social_links,
  footer_menu,
  contact_info
) VALUES (
  'EVMotorHub is India''s leading EV marketplace, helping customers discover, compare, and purchase electric vehicles with confidence.',
  '© 2026 EVMotorHub. All rights reserved.',
  '[]',
  '[]',
  '{"email": "info@evmotorhub.com", "phone": "+91-XXXXX-XXXXX", "address": "India"}'
) ON CONFLICT DO NOTHING;
