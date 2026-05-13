import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY       = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const payload = await req.json()
  const listing = payload.record

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Get poster's email from Auth
  const { data: { user } } = await admin.auth.admin.getUserById(listing.user_id)
  if (!user?.email) return new Response('no user email', { status: 200 })

  // Get poster's display name + notification email from profile
  const { data: profile } = await admin
    .from('profiles')
    .select('display_name, notification_email')
    .eq('id', listing.user_id)
    .single()

  const name = profile?.display_name ?? 'there'
  const toEmail = profile?.notification_email ?? user.email
  const availableFrom = new Date(listing.available_from).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const availableTo   = new Date(listing.available_to).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Purch <hello@purchit.org>',
      to: toEmail,
      reply_to: 'hello@purchit.org',
      subject: 'Your listing is live on Purch',
      html: `
        <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FDFAF7;">
          <p style="font-size:22px;font-weight:600;color:#1a1a1a;margin-bottom:24px;letter-spacing:-0.02em;">purch</p>

          <p style="font-size:22px;font-weight:600;color:#1a1a1a;margin-bottom:8px;letter-spacing:-0.02em;">
            Your listing is live.
          </p>
          <p style="color:#555;font-size:15px;line-height:1.6;margin-bottom:24px;">
            Your sublease is now visible to UNC students on Purch.
          </p>

          <div style="background:#F0EDE8;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <p style="font-size:16px;font-weight:600;color:#1a1a1a;margin:0 0 8px 0;">${listing.title}</p>
            <p style="color:#666;font-size:14px;margin:0 0 4px 0;">${listing.address}</p>
            <p style="color:#666;font-size:14px;margin:0 0 4px 0;">$${listing.rent}/mo</p>
            <p style="color:#666;font-size:14px;margin:0;">${availableFrom} – ${availableTo}</p>
          </div>

          <p style="font-size:15px;line-height:1.6;color:#333;margin-bottom:24px;">
            Tip: listings with photos and detailed descriptions get significantly more views. Add photos to yours if you haven't already.
          </p>

          <a href="https://purchit.org/listings/${listing.id}"
             style="display:inline-block;background:#1a1a1a;color:#F5F0EB;padding:14px 28px;border-radius:100px;text-decoration:none;font-family:Georgia,serif;font-size:15px;font-weight:500;margin-bottom:32px;">
            View your listing →
          </a>

          <p style="margin-top:32px;color:#999;font-size:12px;font-family:monospace;letter-spacing:0.04em;">
            YOU'RE RECEIVING THIS BECAUSE YOU HAVE AN ACCOUNT ON PURCHIT.ORG
          </p>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
    return new Response('email failed', { status: 500 })
  }

  return new Response('ok', { status: 200 })
})
