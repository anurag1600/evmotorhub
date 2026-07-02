-- Add pros and cons columns to vehicle_variants table
-- These were missing but are variant-specific attributes per architecture

ALTER TABLE vehicle_variants 
ADD COLUMN IF NOT EXISTS pros text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cons text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN vehicle_variants.pros IS 'Variant-specific pros/advantages';
COMMENT ON COLUMN vehicle_variants.cons IS 'Variant-specific cons/disadvantages';