/**
 * Export all Purch user emails as a comma-separated list for BCC
 * Run: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/export-emails.js
 */

const SUPABASE_URL         = 'https://viaeewauecesdbbvpztm.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

async function main() {
  let allEmails = []
  let page = 1

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=1000`,
      { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` } }
    )
    const data = await res.json()
    const users = data.users ?? []
    allEmails = allEmails.concat(users.map(u => u.email).filter(Boolean))
    if (users.length < 1000) break
    page++
  }

  console.log(`\nFound ${allEmails.length} accounts\n`)
  console.log('── Paste this into BCC ──────────────────')
  console.log(allEmails.join(', '))
  console.log('─────────────────────────────────────────\n')
}

main()
