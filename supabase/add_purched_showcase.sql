-- Run this in your Supabase SQL editor (after add_purched_flag.sql)

-- Public read access for the "X subleases Purch'd" stat and the "Recently Purch'd"
-- strip on Browse. Purch'd listings are is_active = false, so the listings RLS
-- policy hides them from everyone but their owner. Rather than loosening that
-- policy (which would let purched rows leak into any listings query), these two
-- SECURITY DEFINER functions expose only an aggregate count and a few display
-- fields — no listing id, no full address, no owner — so nothing returned can be
-- linked to, messaged, or put on the map.

CREATE OR REPLACE FUNCTION public.purched_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)
  FROM listings
  WHERE purched_at IS NOT NULL
    AND is_active = false;
$$;

CREATE OR REPLACE FUNCTION public.recently_purched(max_rows integer DEFAULT 8)
RETURNS TABLE (street text, rent integer, bedrooms integer, purched_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Street name only: drop the house number and everything after the first comma
    coalesce(nullif(regexp_replace(trim(split_part(l.address, ',', 1)), '^\d+[A-Za-z]?\s+', ''), ''), 'Chapel Hill'),
    l.rent,
    l.bedrooms,
    l.purched_at
  FROM listings l
  WHERE l.purched_at IS NOT NULL
    AND l.is_active = false
  ORDER BY l.purched_at DESC
  LIMIT least(greatest(max_rows, 0), 12);
$$;

REVOKE ALL ON FUNCTION public.purched_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recently_purched(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purched_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recently_purched(integer) TO anon, authenticated;
