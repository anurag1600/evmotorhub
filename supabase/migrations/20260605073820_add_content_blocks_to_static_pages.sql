
-- Add content_blocks to static_pages
ALTER TABLE static_pages
ADD COLUMN IF NOT EXISTS content_blocks jsonb DEFAULT '[]'::jsonb;
