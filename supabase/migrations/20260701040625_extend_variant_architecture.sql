/*
# Extend Vehicle Variant Architecture for Scalability

## Purpose
This migration extends the existing vehicle_variants and vehicles tables to support
a richer per-variant experience (gallery images, brochure documents, short descriptions)
and establishes a formal default-variant relationship on the vehicles table.

## Changes

### 1. vehicle_variants — new columns (all nullable, no data loss)
- `short_description` (text, nullable): A one-line tagline for the variant, shown in
  selector dropdowns and comparison tables. Optional — null means "use vehicle description".
- `gallery_urls` (text[], default '{}'): Per-variant image gallery. When non-empty,
  the frontend shows variant-specific images instead of the vehicle-level gallery.
  Empty array means "fall back to vehicle gallery".
- `brochure_url` (text, nullable): URL to a PDF brochure specific to this variant.
  Null means no brochure for this variant.

### 2. vehicles — new column
- `default_variant_id` (uuid, nullable): FK to vehicle_variants.id. Points to the
  variant that should be selected by default on the vehicle detail page. Nullable
  so it can be set after variants exist. ON DELETE SET NULL so deleting a variant
  doesn't cascade-delete the vehicle.

### 3. Indexes
- `idx_vehicles_default_variant` on vehicles.default_variant_id for quick lookups.
- `idx_vehicle_variants_status_sort` composite index on (vehicle_id, status, sort_order)
  to optimize the most common frontend query: "get active variants for a vehicle, ordered".

## Security
- No RLS policy changes. Both tables already have public SELECT and admin-scoped
  write policies. The new columns inherit the existing table-level RLS.

## Rollback
- All added columns are nullable and can be safely dropped if needed:
  ALTER TABLE vehicle_variants DROP COLUMN IF EXISTS short_description;
  ALTER TABLE vehicle_variants DROP COLUMN IF EXISTS gallery_urls;
  ALTER TABLE vehicle_variants DROP COLUMN IF EXISTS brochure_url;
  ALTER TABLE vehicles DROP COLUMN IF EXISTS default_variant_id;
- No data is moved, renamed, or deleted by this migration.

## Important Notes
1. This migration is idempotent — uses IF NOT EXISTS for all column additions and
   CREATE INDEX IF NOT EXISTS for indexes.
2. The FK constraint uses ON DELETE SET NULL so removing a variant never cascades
   to the parent vehicle.
3. Existing queries that do SELECT * will simply see the new columns as null/empty —
   no breaking changes.
*/

-- 1. Extend vehicle_variants with per-variant gallery, brochure, and tagline
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicle_variants' AND column_name = 'short_description'
  ) THEN
    ALTER TABLE public.vehicle_variants ADD COLUMN short_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicle_variants' AND column_name = 'gallery_urls'
  ) THEN
    ALTER TABLE public.vehicle_variants ADD COLUMN gallery_urls text[] DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicle_variants' AND column_name = 'brochure_url'
  ) THEN
    ALTER TABLE public.vehicle_variants ADD COLUMN brochure_url text;
  END IF;
END $$;

-- 2. Add default_variant_id to vehicles with FK to vehicle_variants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'default_variant_id'
  ) THEN
    ALTER TABLE public.vehicles ADD COLUMN default_variant_id uuid;
  END IF;
END $$;

-- Add FK constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_vehicles_default_variant'
  ) THEN
    ALTER TABLE public.vehicles
    ADD CONSTRAINT fk_vehicles_default_variant
    FOREIGN KEY (default_variant_id) REFERENCES public.vehicle_variants(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_default_variant
  ON public.vehicles (default_variant_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_variants_status_sort
  ON public.vehicle_variants (vehicle_id, status, sort_order);
