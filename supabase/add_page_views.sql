-- Page view tracking for the "growing fast" ticker on the landing page
CREATE TABLE IF NOT EXISTS page_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Anonymous and authenticated users can log a page view
CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Anyone can read the count (no PII — only timestamps stored)
CREATE POLICY "Anyone can read page views"
  ON page_views FOR SELECT
  TO anon, authenticated
  USING (true);
