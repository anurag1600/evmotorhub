/*
  # Extend Charging Stations Table with Admin Fields

  1. Added Fields
    - booking_available: Can users book slots
    - price_per_kwh: Cost per kWh
    - fast_charging: Supports fast charging
    - phone_support: Support phone
    - status: active | inactive | coming_soon | under_maintenance
    - updated_at: Last update timestamp

  2. Added RLS Policies
    - Admin full CRUD access
*/

DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'charging_stations' AND column_name = 'booking_available'
  ) THEN
    ALTER TABLE charging_stations ADD COLUMN booking_available boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'charging_stations' AND column_name = 'price_per_kwh'
  ) THEN
    ALTER TABLE charging_stations ADD COLUMN price_per_kwh numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'charging_stations' AND column_name = 'fast_charging'
  ) THEN
    ALTER TABLE charging_stations ADD COLUMN fast_charging boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'charging_stations' AND column_name = 'phone_support'
  ) THEN
    ALTER TABLE charging_stations ADD COLUMN phone_support text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'charging_stations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE charging_stations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Drop existing charging policies to replace with admin CRUD
DROP POLICY IF EXISTS "Admins can insert charging stations" ON charging_stations;
DROP POLICY IF EXISTS "Admins can update charging stations" ON charging_stations;
DROP POLICY IF EXISTS "Admins can delete charging stations" ON charging_stations;

-- Re-create with proper checks
CREATE POLICY "Admins can insert charging stations"
  ON charging_stations FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can update charging stations"
  ON charging_stations FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can delete charging stations"
  ON charging_stations FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX IF NOT EXISTS idx_charging_status_v2 ON charging_stations(status);
CREATE INDEX IF NOT EXISTS idx_charging_fast ON charging_stations(fast_charging);
CREATE INDEX IF NOT EXISTS idx_charging_updated ON charging_stations(updated_at DESC);
