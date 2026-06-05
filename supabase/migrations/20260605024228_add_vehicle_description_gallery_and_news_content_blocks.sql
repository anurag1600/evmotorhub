-- Add description and image_gallery to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_gallery text[] DEFAULT '{}';

-- Add content_blocks (structured JSON) to news for block-based editor
ALTER TABLE news ADD COLUMN IF NOT EXISTS content_blocks jsonb DEFAULT '[]';

-- Add map_embed_url and faq to site_config for contact page
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS map_embed_url text DEFAULT '';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS contact_faq jsonb DEFAULT '[]';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS contact_hero_title text DEFAULT 'Get in Touch';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS contact_hero_subtitle text DEFAULT 'We''d love to hear from you';

-- Add news_settings and vehicle_settings to site_config
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS news_settings jsonb DEFAULT '{"posts_per_page": 12, "show_author": true, "show_read_time": true, "default_category": "news"}';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS vehicle_settings jsonb DEFAULT '{"default_sort": "price_asc", "show_upcoming": true, "show_price_range": true, "compare_max_vehicles": 2}';
