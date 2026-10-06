-- Run this in your Supabase SQL editor

-- "Purch'd!" flag: set when a lister marks a listing as successfully subleased
-- through Purch. Purely additive — is_active still controls visibility; a
-- purched listing is always is_active = false. NULL = never purched (or archived).
ALTER TABLE listings ADD COLUMN IF NOT EXISTS purched_at timestamptz;

-- Partial index for the public count / "Recently Purch'd" strip (newest first)
CREATE INDEX IF NOT EXISTS listings_purched_at_idx
  ON listings (purched_at DESC)
  WHERE purched_at IS NOT NULL;
