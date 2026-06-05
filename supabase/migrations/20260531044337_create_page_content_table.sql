/*
  # Create Page Content Table

  1. New Table
    - `page_content` - For managing static pages (About, Contact, Privacy, Terms)

  2. Schema
    - id: UUID primary key
    - slug: Unique identifier for page (about, contact, privacy, terms)
    - title: Page title
    - content: HTML content (rich text)
    - excerpt: Short description
    - meta_title: SEO meta title
    - meta_description: SEO meta description
    - meta_keywords: SEO keywords
    - published: Whether page is live
    - created_at, updated_at: Timestamps

  3. Security
    - RLS enabled: Public read, admin write
    - Anyone can view published pages
    - Only admins can create/update/delete pages
*/

CREATE TABLE IF NOT EXISTS page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  meta_title text,
  meta_description text,
  meta_keywords text[] DEFAULT '{}',
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published pages"
  ON page_content FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "Admins can view all pages"
  ON page_content FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can create pages"
  ON page_content FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can update pages"
  ON page_content FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can delete pages"
  ON page_content FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX idx_page_content_slug ON page_content(slug);
CREATE INDEX idx_page_content_published ON page_content(published);
CREATE INDEX idx_page_content_updated ON page_content(updated_at DESC);
