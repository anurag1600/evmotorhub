-- Security Fix: Replace overly permissive RLS policies with proper access controls

-- ============================================================================
-- 1. Fix charging_submissions: INSERT policy needs basic validation
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can submit charging station" ON charging_submissions;

CREATE POLICY "Anyone can submit charging station" ON charging_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL
    AND name != ''
    AND address IS NOT NULL
    AND address != ''
    AND city IS NOT NULL
    AND city != ''
    AND state IS NOT NULL
    AND state != ''
    AND operator IS NOT NULL
    AND operator != ''
    AND submitted_by IS NOT NULL
    AND submitted_by != ''
  );

-- ============================================================================
-- 2. Fix contact_submissions: INSERT policy needs validation
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can submit contact form" ON contact_submissions;

CREATE POLICY "Anyone can submit contact form" ON contact_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL
    AND name != ''
    AND email IS NOT NULL
    AND email != ''
    AND subject IS NOT NULL
    AND subject != ''
    AND message IS NOT NULL
    AND message != ''
  );

-- ============================================================================
-- 3. Fix email_subscribers: INSERT and UPDATE policies
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_subscribers' AND column_name = 'unsubscribe_token'
  ) THEN
    ALTER TABLE email_subscribers ADD COLUMN unsubscribe_token uuid DEFAULT gen_random_uuid();
    CREATE INDEX IF NOT EXISTS idx_email_subscribers_token ON email_subscribers(unsubscribe_token);
  END IF;
END $$;

DROP POLICY IF EXISTS "Anyone can subscribe" ON email_subscribers;
DROP POLICY IF EXISTS "Users can unsubscribe via email" ON email_subscribers;

CREATE POLICY "Anyone can subscribe" ON email_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND email != ''
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

CREATE POLICY "Token-based unsubscribe" ON email_subscribers
  FOR UPDATE TO anon, authenticated
  USING (unsubscribe_token = auth.uid() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ))
  WITH CHECK (status = 'unsubscribed');

-- ============================================================================
-- 4. Fix faq_items: Restrict INSERT/UPDATE/DELETE to admins only
-- ============================================================================
DROP POLICY IF EXISTS "insert_faq_items" ON faq_items;
DROP POLICY IF EXISTS "update_faq_items" ON faq_items;
DROP POLICY IF EXISTS "delete_faq_items" ON faq_items;

CREATE POLICY "Admins can insert faq items" ON faq_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ));

CREATE POLICY "Admins can update faq items" ON faq_items
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ));

CREATE POLICY "Admins can delete faq items" ON faq_items
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ));

-- ============================================================================
-- 5. Fix popular_comparisons: Restrict INSERT/UPDATE/DELETE to admins only
-- ============================================================================
DROP POLICY IF EXISTS "insert_popular_comparisons" ON popular_comparisons;
DROP POLICY IF EXISTS "update_popular_comparisons" ON popular_comparisons;
DROP POLICY IF EXISTS "delete_popular_comparisons" ON popular_comparisons;

CREATE POLICY "Admins can insert popular comparisons" ON popular_comparisons
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ));

CREATE POLICY "Admins can update popular comparisons" ON popular_comparisons
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ));

CREATE POLICY "Admins can delete popular comparisons" ON popular_comparisons
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ));
