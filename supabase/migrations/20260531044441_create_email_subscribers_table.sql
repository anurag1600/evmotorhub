/*
  # Create Email Subscribers Table

  1. New Table
    - `email_subscribers` - Newsletter subscriptions

  2. Schema
    - id: UUID primary key
    - email: Subscriber email
    - name: Subscriber name (optional)
    - status: active | unsubscribed | bounced
    - verified: Whether email is verified
    - ip_address: For tracking
    - created_at, updated_at: Timestamps

  3. Security
    - RLS enabled: Public can insert, admin can read/update
*/

CREATE TABLE IF NOT EXISTS email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  verified boolean DEFAULT false,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON email_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view subscribers"
  ON email_subscribers FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can update subscribers"
  ON email_subscribers FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can unsubscribe via email"
  ON email_subscribers FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (status = 'unsubscribed');

CREATE POLICY "Admins can delete subscribers"
  ON email_subscribers FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON email_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_created ON email_subscribers(created_at DESC);
