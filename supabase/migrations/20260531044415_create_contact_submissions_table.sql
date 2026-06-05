/*
  # Create Contact Form Submissions Table

  1. New Table
    - `contact_submissions` - Store contact form inquiries

  2. Schema
    - id: UUID primary key
    - name: Submitter name
    - email: Submitter email
    - phone: Submitter phone
    - subject: Inquiry subject
    - message: Inquiry message
    - status: new | responded | closed
    - admin_notes: Internal notes for admin
    - created_at, updated_at: Timestamps
    - ip_address: For spam prevention

  3. Security
    - RLS enabled: Public can insert, admin can read/update
*/

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'responded', 'closed')),
  admin_notes text,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view submissions"
  ON contact_submissions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can update submissions"
  ON contact_submissions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can delete submissions"
  ON contact_submissions FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX idx_contact_email ON contact_submissions(email);
CREATE INDEX idx_contact_status ON contact_submissions(status);
CREATE INDEX idx_contact_created ON contact_submissions(created_at DESC);
