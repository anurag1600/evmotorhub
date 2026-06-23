-- Add ex_showroom_price to vehicles for explicit ex-showroom pricing
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS ex_showroom_price numeric DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN vehicles.ex_showroom_price IS 'Ex-showroom price (base price before RTO, insurance, etc.)';