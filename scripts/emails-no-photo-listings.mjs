#!/usr/bin/env node
// Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/emails-no-photo-listings.mjs

const SUPABASE_URL = 'https://viaeewauecesdbbvpztm.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var.')
  console.error('Run: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/emails-no-photo-listings.mjs')
  process.exit(1)
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

// 1. Get all listings with no photos
const listingsRes = await fetch(
  `${SUPABASE_URL}/rest/v1/listings?select=user_id,photos`,
  { headers }
)
const listings = await listingsRes.json()

const userIds = [
  ...new Set(
    listings
      .filter(l => !l.photos || (Array.isArray(l.photos) && l.photos.length === 0))
      .map(l => l.user_id)
  ),
]

if (userIds.length === 0) {
  console.log('No listings without photos found.')
  process.exit(0)
}

// 2. Fetch emails for each user via admin API
const emails = []
for (const id of userIds) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, { headers })
  const user = await res.json()
  if (user?.email) emails.push(user.email)
}

console.log(`\n${emails.length} user(s) with listings missing photos:\n`)
console.log(emails.join('\n'))
