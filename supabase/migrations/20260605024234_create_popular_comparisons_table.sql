CREATE TABLE IF NOT EXISTS popular_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle1_slug text NOT NULL,
  vehicle2_slug text NOT NULL,
  title text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE popular_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_popular_comparisons" ON popular_comparisons FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "select_popular_comparisons_public" ON popular_comparisons FOR SELECT
  TO anon USING (is_active = true);
CREATE POLICY "insert_popular_comparisons" ON popular_comparisons FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_popular_comparisons" ON popular_comparisons FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_popular_comparisons" ON popular_comparisons FOR DELETE
  TO authenticated USING (true);
