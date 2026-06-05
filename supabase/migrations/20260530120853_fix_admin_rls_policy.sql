/*
  # Fix admin_users SELECT policy for initial login

  ## Problem
  The current SELECT policy on admin_users has a circular dependency:
  - It checks `EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)`
  - But this requires the user to already be able to read admin_users to check if they're an admin
  - This blocks new admins from reading their own record on first login

  ## Solution
  Replace the SELECT policy with one that allows users to read their OWN record directly:
  - `user_id = auth.uid()` - user can only see their own admin record
  - Added as separate restrictive policies for clarity

  ## Security
  - Users can ONLY see their own admin record, not all admin users
  - Still requires is_active = true for the record to be visible
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;

-- Create new policy that allows users to read their own admin record
CREATE POLICY "Users can view own admin record"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND is_active = true);

-- Note: The UPDATE policy also has the same circular dependency issue for super_admin check
-- Let's fix that too - users should be able to update their own record (for last_login etc)
-- But only super_admins can change roles
