/*
  # Extend site_config for Homepage Settings and Contact Info

  ## Changes
  1. Added hero section columns to site_config:
     - hero_title, hero_subtitle, hero_description
     - hero_cta_text, hero_cta_url
  2. Added homepage section visibility toggles (jsonb)
  3. Added contact_info jsonb (phone, email, address, whatsapp)
  4. Added social_media jsonb (facebook, instagram, linkedin, youtube, twitter)

  ## Notes
  - All new columns have safe defaults
  - No existing data is modified
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_config' AND column_name = 'hero_title'
  ) THEN
    ALTER TABLE site_config ADD COLUMN hero_title text DEFAULT 'Discover India''s Best Electric Vehicles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_config' AND column_name = 'hero_subtitle'
  ) THEN
    ALTER TABLE site_config ADD COLUMN hero_subtitle text DEFAULT 'Smarter. Greener. Better.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_config' AND column_name = 'hero_description'
  ) THEN
    ALTER TABLE site_config ADD COLUMN hero_description text DEFAULT 'Compare 50+ EV models, calculate EMI, and find charging stations near you.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_config' AND column_name = 'hero_cta_text'
  ) THEN
    ALTER TABLE site_config ADD COLUMN hero_cta_text text DEFAULT 'Explore Vehicles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_config' AND column_name = 'hero_cta_url'
  ) THEN
    ALTER TABLE site_config ADD COLUMN hero_cta_url text DEFAULT '/vehicles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_config' AND column_name = 'section_toggles'
  ) THEN
    ALTER TABLE site_config ADD COLUMN section_toggles jsonb DEFAULT '{
      "show_featured_vehicles": true,
      "show_latest_news": true,
      "show_manufacturers": true,
      "show_charging_stations": true
    }';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_config' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE site_config ADD COLUMN contact_info jsonb DEFAULT '{
      "phone": "+91 80 4567 8900",
      "email": "hello@evmotorhub.in",
      "address": "Bengaluru, Karnataka, India",
      "whatsapp": ""
    }';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_config' AND column_name = 'social_media'
  ) THEN
    ALTER TABLE site_config ADD COLUMN social_media jsonb DEFAULT '{
      "facebook": "",
      "instagram": "",
      "linkedin": "",
      "youtube": "",
      "twitter": ""
    }';
  END IF;
END $$;
