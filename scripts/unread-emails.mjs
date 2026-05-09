// Run: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx node scripts/unread-emails.mjs
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing env vars: SUPABASE_URL and SUPABASE_SERVICE_KEY are required')
  process.exit(1)
}

// Service role key bypasses RLS — keep this secret
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const { data, error } = await supabase
  .from('profiles')
  .select('email')
  .order('created_at', { ascending: true })

if (error) {
  console.error('Query failed:', error.message)
  process.exit(1)
}

const emails = data.map(row => row.email).filter(Boolean)

if (emails.length === 0) {
  console.log('No users found.')
} else {
  console.log(`\n${emails.length} user(s) on Perch:\n`)
  emails.forEach(email => console.log(email))
  console.log()
}
