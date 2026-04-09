import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY     = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const payload = await req.json()
  const message = payload.record   // the newly inserted message row

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Look up recipient email from Supabase Auth
  const { data: { user: recipient } } = await admin.auth.admin.getUserById(message.recipient_id)
  if (!recipient?.email) return new Response('no recipient email', { status: 200 })

  // Look up sender display name
  const { data: sender } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', message.sender_id)
    .single()

  const senderName = sender?.display_name ?? 'A student'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Purch <onboarding@resend.dev>',
      to: recipient.email,
      subject: `${senderName} sent you a message on Purch`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <p style="font-size: 20px; font-weight: 700; color: #13294B; margin-bottom: 4px;">New message on Purch</p>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">
            <strong style="color: #13294B;">${senderName}</strong> sent you a message:
          </p>
          <div style="background: #f8fafc; border-left: 3px solid #13294B; padding: 16px 20px; border-radius: 0 8px 8px 0; color: #1e293b; font-size: 15px; line-height: 1.6;">
            ${message.body}
          </div>
          <a href="https://purch.it/messages"
             style="display: inline-block; margin-top: 24px; background: #13294B; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Reply on Purch →
          </a>
          <p style="margin-top: 32px; color: #94a3b8; font-size: 12px;">
            You're receiving this because you have an account on Purch.
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
