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

  // Get poster's display name from profile
  const { data: profile } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', listing.user_id)
    .single()

  const name = profile?.display_name ?? 'there'
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
      to: user.email,
      reply_to: 'hello@purchit.org',
      subject: 'Your listing is live on Purch',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 22px; font-weight: 800; color: #13294B;">purch</span>
          </div>

          <p style="font-size: 20px; font-weight: 700; color: #13294B; margin-bottom: 8px;">
            Your listing is live
          </p>
          <p style="color: #64748b; font-size: 15px; margin-bottom: 24px;">
            Hey ${name}, your sublease is now visible to UNC students on Purch.
          </p>

          <div style="background: #f8fafc; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
            <p style="font-size: 16px; font-weight: 700; color: #13294B; margin: 0 0 8px 0;">${listing.title}</p>
            <p style="color: #64748b; font-size: 14px; margin: 0 0 4px 0;">${listing.address}</p>
            <p style="color: #64748b; font-size: 14px; margin: 0 0 4px 0;">$${listing.rent}/mo</p>
            <p style="color: #64748b; font-size: 14px; margin: 0;">${availableFrom} – ${availableTo}</p>
          </div>

          <a href="https://purchit.org/browse"
             style="display: inline-block; background: #13294B; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
            View your listing →
          </a>

          <p style="margin-top: 32px; color: #94a3b8; font-size: 12px;">
            You'll get an email notification whenever a student messages you about this listing.
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
