
-- Create FAQ items table
CREATE TABLE IF NOT EXISTS faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general',
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "select_faq_items" ON faq_items FOR SELECT TO public USING (true);
CREATE POLICY "select_faq_items_auth" ON faq_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_faq_items" ON faq_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_faq_items" ON faq_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_faq_items" ON faq_items FOR DELETE TO authenticated USING (true);
