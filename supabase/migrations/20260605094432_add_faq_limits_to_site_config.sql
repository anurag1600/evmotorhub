ALTER TABLE site_config
  ADD COLUMN IF NOT EXISTS faq_homepage_limit integer DEFAULT 6,
  ADD COLUMN IF NOT EXISTS faq_contact_limit integer DEFAULT 4;