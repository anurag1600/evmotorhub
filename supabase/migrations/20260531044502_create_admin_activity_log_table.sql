/*
  # Create Admin Activity Log Table

  1. New Table
    - `admin_activity_log` - Audit trail for admin actions

  2. Schema
    - id: UUID primary key
    - admin_id: UUID of admin who performed action
    - action: Type of action (create, update, delete, publish, etc)
    - table_name: Which table was modified
    - record_id: ID of record modified
    - old_data: Previous values (JSON)
    - new_data: New values (JSON)
    - ip_address: IP address of admin
    - user_agent: Browser info
    - created_at: Timestamp

  3. Security
    - RLS enabled: Admins can read, auto-insert on admin actions
*/

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log"
  ON admin_activity_log FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX IF NOT EXISTS idx_activity_admin ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_table ON admin_activity_log(table_name);
CREATE INDEX IF NOT EXISTS idx_activity_created ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_action ON admin_activity_log(action);
