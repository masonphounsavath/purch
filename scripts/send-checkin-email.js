/**
 * Purch check-in email blast
 * Pulls every user from Supabase and sends a check-in email via Resend.
 *
 * Required env vars (add to .env.local or export in your shell):
 *   SUPABASE_SERVICE_ROLE_KEY  — from Supabase dashboard → Settings → API
 *   RESEND_API_KEY             — from resend.com dashboard
 *
 * Run:
 *   node scripts/send-checkin-email.js
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL         = 'https://viaeewauecesdbbvpztm.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY       = process.env.RESEND_API_KEY
const FROM                 = 'Mason from Purch <mason@purchit.org>'
const SITE_URL             = 'https://purchit.org'

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!RESEND_API_KEY) {
  console.error('Missing RESEND_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function buildEmail() {
  return {
    subject: "hey — check your messages on Purch 👀",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FDFAF7;border-radius:16px;overflow:hidden;border:1px solid #E8E2DA;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #E8E2DA;">
              <span style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#1a1a1a;letter-spacing:-0.02em;">purch</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#1a1a1a;">Hey,</p>

              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#333;">
                Just checking in — if you've been active on Purch, there's a good chance someone has messaged you about a sublease and is still waiting to hear back. Don't leave them hanging!
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="background:#1a1a1a;border-radius:100px;padding:14px 28px;">
                    <a href="${SITE_URL}/messages" style="color:#F5F0EB;text-decoration:none;font-family:Georgia,serif;font-size:15px;font-weight:500;letter-spacing:-0.01em;">
                      Check your messages →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#333;">
                And if you haven't received any messages yet — no worries. Here's a quick tip: <strong>listings with photos and detailed descriptions get significantly more views.</strong> If your listing is light on info, take a few minutes to add some pictures and flesh out the details. It makes a real difference.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:20px 0;">
                <tr>
                  <td style="background:transparent;border-radius:100px;padding:13px 28px;border:1px solid #1a1a1a;">
                    <a href="${SITE_URL}/profile" style="color:#1a1a1a;text-decoration:none;font-family:Georgia,serif;font-size:15px;font-weight:500;letter-spacing:-0.01em;">
                      Update your listing →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:16px;line-height:1.6;color:#1a1a1a;">
                — Mason<br>
                <span style="font-size:13px;color:#888;">Purch · The Chapel Hill sublease board</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #E8E2DA;">
              <p style="margin:0;font-size:12px;color:#999;font-family:monospace;letter-spacing:0.04em;">
                YOU'RE RECEIVING THIS BECAUSE YOU HAVE AN ACCOUNT ON PURCHIT.ORG
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }
}

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error for ${to}: ${err}`)
  }
  return res.json()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('Fetching users from Supabase...')

  // Paginate through all users (Supabase returns max 1000 per page)
  let allUsers = []
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) { console.error('Supabase error:', error); process.exit(1) }
    allUsers = allUsers.concat(data.users)
    if (data.users.length < 1000) break
    page++
  }

  const emails = allUsers.map(u => u.email).filter(Boolean)
  console.log(`Found ${emails.length} users. Sending emails...\n`)

  const { subject, html } = buildEmail()
  let sent = 0, failed = 0

  for (const email of emails) {
    try {
      await sendEmail(email, subject, html)
      console.log(`✓ ${email}`)
      sent++
    } catch (err) {
      console.error(`✗ ${email} — ${err.message}`)
      failed++
    }
    // 3 emails/sec to stay under Resend rate limits
    await sleep(333)
  }

  console.log(`\nDone. ${sent} sent, ${failed} failed.`)
}

main()
