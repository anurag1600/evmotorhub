/*
  # Extend Manufacturers Table with Admin Fields

  1. Added Fields
    - contact_email: Support/contact email
    - support_phone: Support phone number
    - model_year_start: Year when brand started EV models
    - featured_until: Date until featured flag should be active
    - warranty_info: Warranty details (JSON)
    - status: active | inactive

  2. Added RLS Policies
    - Admin write access for full CRUD
*/

DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manufacturers' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE manufacturers ADD COLUMN contact_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manufacturers' AND column_name = 'support_phone'
  ) THEN
    ALTER TABLE manufacturers ADD COLUMN support_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manufacturers' AND column_name = 'model_year_start'
  ) THEN
    ALTER TABLE manufacturers ADD COLUMN model_year_start integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manufacturers' AND column_name = 'featured_until'
  ) THEN
    ALTER TABLE manufacturers ADD COLUMN featured_until timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manufacturers' AND column_name = 'warranty_info'
  ) THEN
    ALTER TABLE manufacturers ADD COLUMN warranty_info jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manufacturers' AND column_name = 'status'
  ) THEN
    ALTER TABLE manufacturers ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manufacturers' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE manufacturers ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Drop existing manufacturer policies to replace with admin CRUD
DROP POLICY IF EXISTS "Admins can insert manufacturers" ON manufacturers;
DROP POLICY IF EXISTS "Admins can update manufacturers" ON manufacturers;
DROP POLICY IF EXISTS "Admins can delete manufacturers" ON manufacturers;

-- Re-create with proper checks
CREATE POLICY "Admins can insert manufacturers"
  ON manufacturers FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can update manufacturers"
  ON manufacturers FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can delete manufacturers"
  ON manufacturers FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX IF NOT EXISTS idx_manufacturers_status ON manufacturers(status);
CREATE INDEX IF NOT EXISTS idx_manufacturers_featured ON manufacturers(is_featured, created_at DESC);
