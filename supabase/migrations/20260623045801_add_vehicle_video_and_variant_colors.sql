-- Add video_url to vehicles for YouTube videos
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add multiple colors support to vehicle_variants  
-- color will store JSON array of color names, color_hex will store JSON array of hex codes
ALTER TABLE vehicle_variants ADD COLUMN IF NOT EXISTS colors TEXT[];
ALTER TABLE vehicle_variants ADD COLUMN IF NOT EXISTS color_hexes TEXT[];