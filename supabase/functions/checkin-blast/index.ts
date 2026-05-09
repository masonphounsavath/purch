import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_APP_PASSWORD  = Deno.env.get('GOOGLE_APP_PASSWORD')!

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
    Just checking in. If you've been active on Purch, there's a good chance someone has already messaged you about a sublease and is waiting to hear back. Don't leave them hanging!
  </p>

  <a href="https://purchit.org/messages"
     style="display:inline-block;background:#1a1a1a;color:#F5F0EB;padding:14px 28px;border-radius:100px;text-decoration:none;font-family:Georgia,serif;font-size:15px;font-weight:500;margin-bottom:24px;">
    Check your messages →
  </a>

  <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:16px;">
    No messages yet? No worries. Quick tip: <strong>listings with photos and a solid description get way more views.</strong> If yours is light on details, take a few minutes to update it. It makes a real difference.
  </p>

  <a href="https://purchit.org/profile"
     style="display:inline-block;border:1px solid #1a1a1a;color:#1a1a1a;padding:13px 28px;border-radius:100px;text-decoration:none;font-family:Georgia,serif;font-size:15px;font-weight:500;margin-bottom:32px;">
    Update your listing →
  </a>

  <p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin-bottom:4px;">— Purch</p>

  <p style="margin-top:32px;color:#999;font-size:12px;font-family:monospace;letter-spacing:0.04em;">
    YOU'RE RECEIVING THIS BECAUSE YOU HAVE AN ACCOUNT ON PURCHIT.ORG
  </p>
</div>
`.trim()

Deno.serve(async () => {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let allUsers: { email?: string }[] = []
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return new Response(`Supabase error: ${error.message}`, { status: 500 })
    allUsers = allUsers.concat(data.users)
    if (data.users.length < 1000) break
    page++
  }

  const emails = allUsers.map(u => u.email).filter(Boolean) as string[]
  console.log(`Sending to ${emails.length} users...`)

  let sent = 0, failed = 0

  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: 'Purch <mason@purchit.org>',
        to: email,
        subject: "hey — check your messages on Purch 👀",
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

  return new Response(JSON.stringify({ sent, failed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
