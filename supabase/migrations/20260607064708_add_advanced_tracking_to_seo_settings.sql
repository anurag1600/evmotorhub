ALTER TABLE seo_settings
  ADD COLUMN IF NOT EXISTS gtm_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_pixel_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS clarity_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_ads_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS custom_head_scripts text DEFAULT '',
  ADD COLUMN IF NOT EXISTS custom_footer_scripts text DEFAULT '';
