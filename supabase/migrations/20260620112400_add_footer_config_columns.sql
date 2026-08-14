ALTER TABLE site_config
ADD COLUMN IF NOT EXISTS footer_company_name TEXT DEFAULT 'EVMotorHub',
ADD COLUMN IF NOT EXISTS footer_tagline TEXT DEFAULT 'India''s trusted EV marketplace',
ADD COLUMN IF NOT EXISTS footer_description TEXT DEFAULT 'India''s trusted EV marketplace. Research, compare, and find your perfect electric vehicle.',
ADD COLUMN IF NOT EXISTS footer_powered_by_text TEXT DEFAULT 'Powered by clean energy data';
