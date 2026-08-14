-- Remove ex_showroom_price column from vehicles table
-- This field is no longer used; price_min and price_max are the primary pricing fields

ALTER TABLE vehicles DROP COLUMN IF EXISTS ex_showroom_price;