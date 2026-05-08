import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY      = Deno.env.get('RESEND_API_KEY')!

Deno.serve(async (req) => {
  const payload = await req.json()
  const message = payload.record

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Fetch sender name + recipient notification email in parallel
  const [{ data: sender }, { data: recipient }] = await Promise.all([
    admin.from('profiles').select('display_name').eq('id', message.sender_id).single(),
    admin.from('profiles').select('notification_email').eq('id', message.recipient_id).single(),
  ])

  const senderName = sender?.display_name ?? 'Someone'

  // Send push notification (existing behavior)
  await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: message.recipient_id,
      title: 'New message on Purch',
      body: `${senderName} sent you a message`,
      url: 'https://purchit.org/messages',
    }),
  })

  // Send email notification if recipient has a personal email set
  if (recipient?.notification_email) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mason at Purch <mason@purchit.org>',
        to: recipient.notification_email,
        reply_to: 'mason@purchit.org',
        subject: `${senderName} sent you a message on Purch`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #F7F4EE;">
            <img src="https://purchit.org/logo-icon.png" alt="Purch" style="width: 32px; height: 32px; margin-bottom: 24px;" />
            <p style="font-size: 22px; font-weight: 700; color: #1B1D20; margin-bottom: 8px;">
              You have a new message.
            </p>
            <p style="color: #7A7670; font-size: 15px; line-height: 1.6; margin-bottom: 28px;">
              <strong style="color: #1B1D20;">${senderName}</strong> sent you a message about a listing on Purch. Don't leave them waiting.
            </p>
            <a href="https://purchit.org/messages"
               style="display: inline-block; background: #1B1D20; color: #F7F4EE; padding: 13px 28px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Read message →
            </a>
            <p style="margin-top: 36px; color: #7A7670; font-size: 12px; border-top: 1px solid #E3DDD0; padding-top: 16px;">
              You're receiving this because you have a Purch account. To update your notification email, visit your profile at purchit.org.
            </p>
          </div>
        `,
      }),
    })
  }

  return new Response('ok', { status: 200 })
})
