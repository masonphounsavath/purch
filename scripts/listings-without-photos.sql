-- Listings without photos — paste into Supabase SQL editor
-- Returns one email per user who has at least one listing with no photos.
-- BCC these into your outreach email.

SELECT DISTINCT
  au.email
FROM listings l
JOIN auth.users au ON au.id = l.user_id
WHERE
  l.photos IS NULL
  OR l.photos = '[]'::jsonb
  OR jsonb_array_length(l.photos) = 0;
