-- Drop existing admin policies
DROP POLICY IF EXISTS admin_select_offer_enquiries ON offer_enquiries;
DROP POLICY IF EXISTS admin_insert_offer_enquiries ON offer_enquiries;
DROP POLICY IF EXISTS admin_update_offer_enquiries ON offer_enquiries;
DROP POLICY IF EXISTS admin_delete_offer_enquiries ON offer_enquiries;

-- Recreate with correct user_id check
CREATE POLICY admin_select_offer_enquiries ON offer_enquiries
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  ));

CREATE POLICY admin_insert_offer_enquiries ON offer_enquiries
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  ));

CREATE POLICY admin_update_offer_enquiries ON offer_enquiries
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  ));

CREATE POLICY admin_delete_offer_enquiries ON offer_enquiries
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Keep public insert for frontend form submissions (already exists, but ensure it's there)
DROP POLICY IF EXISTS public_insert_offer_enquiries ON offer_enquiries;
CREATE POLICY public_insert_offer_enquiries ON offer_enquiries
  FOR INSERT TO public
  WITH CHECK (true);