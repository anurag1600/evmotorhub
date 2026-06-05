
-- Add hero section fields to site_config
ALTER TABLE site_config
ADD COLUMN IF NOT EXISTS hero_badge_text text DEFAULT '',
ADD COLUMN IF NOT EXISTS hero_cta2_text text DEFAULT '',
ADD COLUMN IF NOT EXISTS hero_cta2_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS hero_right_main_image text DEFAULT '',
ADD COLUMN IF NOT EXISTS hero_right_secondary_images jsonb DEFAULT '[]'::jsonb;
