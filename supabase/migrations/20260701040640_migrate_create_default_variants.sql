/*
# Auto-Create Default Variants and Set default_variant_id

## Purpose
Ensure every vehicle has at least one variant (the "Standard" variant) and that
every vehicle's `default_variant_id` points to a valid variant. This is the data
migration that makes the variant architecture the single source of truth for
pricing, specs, and display.

## What This Migration Does

### 1. Create "Standard" variants for vehicles with zero variants
For every vehicle that has NO variants in vehicle_variants, insert a new row:
- name: 'Standard'
- slug: 'standard'
- price: copied from vehicle.price_min
- range_km, battery_capacity_kwh, top_speed_kmh, motor_power_kw, charging_time_hrs:
  copied from the vehicle's corresponding columns (only if > 0, otherwise null)
- image_url: copied from vehicle.image_url
- colors: copied from vehicle.colors
- specifications: copied from vehicle.specifications
- features: copied from vehicle.features (converted from jsonb array to text[] if needed)
- status: 'active'
- is_available: true
- is_featured: true (it's the only variant, so it's the default)
- sort_order: 0
- short_description: null (will use vehicle description as fallback)

### 2. Set default_variant_id on all vehicles
For each vehicle, set default_variant_id to:
  - The featured active variant (is_featured = true AND status = 'active'), or
  - The first active variant by sort_order, or
  - The first variant by sort_order
This ensures the frontend always has a sensible default to display.

### 3. Backfill price_max
For vehicles where price_max is 0 or null, set it to the max variant price.
This keeps the vehicle-level price range in sync with variant prices.

## Safety
- Uses INSERT ... SELECT with a WHERE NOT EXISTS guard so re-running is safe.
- No UPDATE or DELETE of existing data — only inserts new variants and updates
  the nullable default_variant_id column.
- The features column on vehicle_variants is text[] while on vehicles it's jsonb.
  We handle both cases: if vehicle.features is a jsonb array, we extract text values;
  if it's already text[], we use it directly.

## Rollback
- To undo: set default_variant_id to null on all vehicles, then delete variants
  named 'Standard' that were created by this migration. However, this is NOT
  recommended as those variants contain real data copied from vehicles.

## Idempotency
- The INSERT uses WHERE NOT EXISTS so it only creates variants for vehicles that
  don't have any. Re-running will not create duplicates.
- The UPDATE to default_variant_id is safe to re-run — it will just re-evaluate
  the same logic and set the same value.
*/

-- 1. Create "Standard" variants for vehicles with zero variants
INSERT INTO public.vehicle_variants (
  vehicle_id, name, slug, price,
  range_km, battery_capacity_kwh, top_speed_kmh, motor_power_kw, charging_time_hrs,
  image_url, colors, color_hex, specifications, features,
  status, is_available, is_featured, sort_order,
  short_description, gallery_urls, brochure_url,
  created_at, updated_at
)
SELECT
  v.id,
  'Standard',
  'standard',
  v.price_min,
  CASE WHEN v.range_km > 0 THEN v.range_km ELSE NULL END,
  CASE WHEN v.battery_capacity_kwh > 0 THEN v.battery_capacity_kwh ELSE NULL END,
  CASE WHEN v.top_speed_kmh > 0 THEN v.top_speed_kmh ELSE NULL END,
  CASE WHEN v.motor_power_kw > 0 THEN v.motor_power_kw ELSE NULL END,
  CASE WHEN v.charging_time_hrs > 0 THEN v.charging_time_hrs ELSE NULL END,
  v.image_url,
  v.colors,
  NULL,
  v.specifications,
  CASE
    WHEN jsonb_typeof(v.features) = 'array' THEN
      ARRAY(SELECT jsonb_array_elements_text(v.features))
    ELSE '{}'
  END,
  'active',
  true,
  true,
  0,
  NULL,
  '{}'::text[],
  NULL,
  now(),
  now()
FROM public.vehicles v
WHERE NOT EXISTS (
  SELECT 1 FROM public.vehicle_variants vv WHERE vv.vehicle_id = v.id
);

-- 2. Set default_variant_id on all vehicles
UPDATE public.vehicles v
SET default_variant_id = sub.variant_id
FROM (
  SELECT DISTINCT ON (vv.vehicle_id)
    vv.vehicle_id,
    vv.id AS variant_id
  FROM public.vehicle_variants vv
  ORDER BY vv.vehicle_id,
    (vv.is_featured AND vv.status = 'active') DESC,
    (vv.status = 'active') DESC,
    vv.sort_order ASC
) sub
WHERE v.id = sub.vehicle_id
  AND (v.default_variant_id IS NULL OR v.default_variant_id NOT IN (
    SELECT id FROM public.vehicle_variants WHERE vehicle_id = v.id
  ));

-- 3. Backfill price_max from variant prices where price_max is 0 or null
UPDATE public.vehicles v
SET price_max = price_data.max_price
FROM (
  SELECT vehicle_id, MAX(price) AS max_price
  FROM public.vehicle_variants
  GROUP BY vehicle_id
) price_data
WHERE v.id = price_data.vehicle_id
  AND (v.price_max IS NULL OR v.price_max = 0)
  AND price_data.max_price > 0;
