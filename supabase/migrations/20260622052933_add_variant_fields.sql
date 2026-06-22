-- Add missing columns to vehicle_variants table
ALTER TABLE vehicle_variants 
ADD COLUMN IF NOT EXISTS short_name TEXT,
ADD COLUMN IF NOT EXISTS kerb_weight INTEGER,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';

-- Rename is_active to is_available for consistency (if is_available doesn't exist)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicle_variants' AND column_name = 'is_active'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicle_variants' AND column_name = 'is_available'
  ) THEN
    ALTER TABLE vehicle_variants RENAME COLUMN is_active TO is_available;
  END IF;
END $$;

-- Create index on is_featured for faster filtering
CREATE INDEX IF NOT EXISTS idx_vehicle_variants_featured ON vehicle_variants(vehicle_id, is_featured) WHERE is_featured = TRUE;

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_vehicle_variants_status ON vehicle_variants(vehicle_id, status);