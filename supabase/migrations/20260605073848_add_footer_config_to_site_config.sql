
-- Add footer configuration fields to site_config
ALTER TABLE site_config
ADD COLUMN IF NOT EXISTS footer_show_social boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS footer_show_quick_links boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS footer_show_contact boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS footer_show_legal boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS footer_show_copyright boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS footer_show_newsletter boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS footer_copyright_text text DEFAULT '',
ADD COLUMN IF NOT EXISTS footer_custom_links jsonb DEFAULT '[]'::jsonb;
