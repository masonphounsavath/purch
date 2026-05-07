import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY       = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BLAST_SECRET         = Deno.env.get('BLAST_SECRET')!

Deno.serve(async (req) => {
  // Protect against accidental re-fires
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${BLAST_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Get all distinct recipient_ids who have been messaged
  const { data: messages, error } = await admin
    .from('messages')
    .select('recipient_id')

  if (error) {
    console.error('Error fetching messages:', error)
    return new Response('Failed to fetch messages', { status: 500 })
  }

  const uniqueUserIds = [...new Set(messages.map((m: { recipient_id: string }) => m.recipient_id))]
  console.log(`Sending to ${uniqueUserIds.length} messaged listers`)

  const results = await Promise.allSettled(
    uniqueUserIds.map(async (userId: string) => {
      const { data: { user } } = await admin.auth.admin.getUserById(userId)
      if (!user?.email) return

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
          subject: 'Don\'t miss your messages on Purch',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
              <p style="font-size: 20px; font-weight: 700; color: #13294B; margin-bottom: 4px;">You have a listing on Purch</p>
              <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                Our records show you have an active listing — don't forget to check your messages!
                Students may have already reached out about your place.
              </p>
              <a href="https://purchit.org/messages"
                 style="display: inline-block; background: #13294B; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Check my messages →
              </a>
              <p style="margin-top: 32px; color: #94a3b8; font-size: 12px;">
                You're receiving this because you have an active listing on Purch.
              </p>
            </div>
          `,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error(`Failed for ${user.email}:`, err)
        throw new Error(err)
      }
    })
  )

  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed    = results.filter(r => r.status === 'rejected').length

  return new Response(
    JSON.stringify({ sent: succeeded, failed, total: uniqueUserIds.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
