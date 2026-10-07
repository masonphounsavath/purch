import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_APP_PASSWORD  = Deno.env.get('GOOGLE_APP_PASSWORD')!
const BLAST_SECRET         = Deno.env.get('BLAST_SECRET')

// Fill in the real Google Form link before firing — sends are refused until then
const FEEDBACK_FORM_URL = 'GOOGLE_FORM_URL_PLACEHOLDER'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: 'mason@purchit.org', pass: GOOGLE_APP_PASSWORD },
})

const html = `
<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FDFAF7;">
  <p style="font-size:22px;font-weight:600;color:#1a1a1a;margin-bottom:24px;letter-spacing:-0.02em;">purch</p>

  <p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin-bottom:16px;">Hey,</p>

  <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:16px;">
    Quick one — if you've posted a sublease on Purch, can you take 30 seconds to update it?
  </p>

  <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:16px;">
    <strong>Found your subletter through Purch?</strong> Hit "Purch'd!" on your listing in your profile.
  </p>

  <a href="https://purchit.org/profile"
     style="display:inline-block;background:#1a1a1a;color:#F5F0EB;padding:14px 28px;border-radius:100px;text-decoration:none;font-family:Georgia,serif;font-size:15px;font-weight:500;margin-bottom:24px;">
    Update your listings →
  </a>

  <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:16px;">
    <strong>Listing no longer available?</strong> Hit "Archive" so it stops showing up for people still searching.
  </p>

  <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:16px;">
    Spring sublease season is picking up as people head abroad — a clean, live set of listings makes a real difference for students searching right now.
  </p>

  <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:24px;">
    Also, if you've got 2 minutes, we'd love to hear how Purch worked for you:
    <a href="${FEEDBACK_FORM_URL}" style="color:#1a1a1a;text-decoration:underline;">share your feedback</a>.
  </p>

  <p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin-bottom:4px;">— Purch</p>

  <p style="margin-top:32px;color:#999;font-size:12px;font-family:monospace;letter-spacing:0.04em;">
    YOU'RE RECEIVING THIS BECAUSE YOU HAVE AN ACTIVE LISTING ON PURCHIT.ORG
  </p>
</div>
`.trim()

Deno.serve(async (req) => {
  // Protect against accidental re-fires (fails closed if BLAST_SECRET isn't set)
  const auth = req.headers.get('Authorization')
  if (!BLAST_SECRET || auth !== `Bearer ${BLAST_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const dryRun = new URL(req.url).searchParams.get('dry_run') === '1'

  if (!dryRun && FEEDBACK_FORM_URL.includes('PLACEHOLDER')) {
    return new Response('Set FEEDBACK_FORM_URL before sending', { status: 400 })
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Only owners of currently-active listings — this email is about managing one
  const { data: listings, error } = await admin
    .from('listings')
    .select('user_id')
    .eq('is_active', true)

  if (error) return new Response(`Supabase error: ${error.message}`, { status: 500 })

  const userIds = [...new Set(listings.map((l: { user_id: string }) => l.user_id))]

  const emails: string[] = []
  for (const userId of userIds) {
    const { data: { user } } = await admin.auth.admin.getUserById(userId)
    if (user?.email) emails.push(user.email)
  }

  if (dryRun) {
    return new Response(JSON.stringify({ dryRun: true, owners: userIds.length, recipients: emails.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`Sending to ${emails.length} active-listing owners...`)

  let sent = 0, failed = 0

  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: 'Purch <mason@purchit.org>',
        to: email,
        subject: 'quick favor before spring sublease season',
        html,
      })
      console.log(`✓ ${email}`)
      sent++
    } catch (err) {
      console.error(`✗ ${email}:`, err)
      failed++
    }
    await new Promise(r => setTimeout(r, 333))
  }

  return new Response(JSON.stringify({ sent, failed, total: emails.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
