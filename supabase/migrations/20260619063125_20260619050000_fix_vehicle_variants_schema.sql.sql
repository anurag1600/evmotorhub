-- Add missing columns to vehicle_variants table
ALTER TABLE vehicle_variants ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE vehicle_variants ADD COLUMN IF NOT EXISTS top_speed_kmh INTEGER;
ALTER TABLE vehicle_variants ADD COLUMN IF NOT EXISTS motor_power_kw DECIMAL(10,2);
ALTER TABLE vehicle_variants ADD COLUMN IF NOT EXISTS charging_time_hrs DECIMAL(5,2);
ALTER TABLE vehicle_variants ADD COLUMN IF NOT EXISTS color_hex VARCHAR(7);
ALTER TABLE vehicle_variants ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE vehicle_variants ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE vehicle_variants ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Rename variant_name to name for consistency (if not already done)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicle_variants' AND column_name = 'variant_name') THEN
    ALTER TABLE vehicle_variants RENAME COLUMN variant_name TO name;
  END IF;
END $$;

-- Create index for sort order
CREATE INDEX IF NOT EXISTS idx_vehicle_variants_sort_order ON vehicle_variants(sort_order);

-- Add unique constraint on slug per vehicle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_variants_vehicle_id_slug_key'
  ) THEN
    ALTER TABLE vehicle_variants ADD CONSTRAINT vehicle_variants_vehicle_id_slug_key UNIQUE (vehicle_id, slug);
  END IF;
END $$;
