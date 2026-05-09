/**
 * Check email blast stats
 * Run: SUPABASE_SERVICE_ROLE_KEY=your_key RESEND_API_KEY=your_key node scripts/email-stats.js
 */

const SUPABASE_URL         = 'https://viaeewauecesdbbvpztm.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY       = process.env.RESEND_API_KEY

if (!SUPABASE_SERVICE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
if (!RESEND_API_KEY)       { console.error('Missing RESEND_API_KEY'); process.exit(1) }

async function getUserCount() {
  let total = 0, page = 1
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=1000`,
      { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` } }
    )
    const data = await res.json()
    const users = data.users ?? []
    total += users.length
    if (users.length < 1000) break
    page++
  }
  return total
}

async function getResendStats() {
  const res = await fetch('https://api.resend.com/emails?limit=100', {
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
  })
  const data = await res.json()
  const emails = data.data ?? []

  // Filter to today's checkin-blast emails
  const today = new Date().toDateString()
  const todayEmails = emails.filter(e =>
    new Date(e.created_at).toDateString() === today &&
    e.subject?.includes('check your messages')
  )

  const delivered = todayEmails.filter(e => e.last_event === 'delivered').length
  const sent      = todayEmails.filter(e => ['sent', 'delivered'].includes(e.last_event)).length
  const bounced   = todayEmails.filter(e => e.last_event === 'bounced').length

  return { total: todayEmails.length, delivered, sent, bounced }
}

async function main() {
  const [userCount, resend] = await Promise.all([getUserCount(), getResendStats()])

  console.log('\n── Purch Email Stats ──────────────────')
  console.log(`  Total accounts:  ${userCount}`)
  console.log(`  Emails sent:     ${resend.total}`)
  console.log(`  Delivered:       ${resend.delivered}`)
  console.log(`  Bounced:         ${resend.bounced}`)
  console.log('───────────────────────────────────────\n')
}

main()
