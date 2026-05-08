import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const payload = await req.json()
  const message = payload.record

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: sender } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', message.sender_id)
    .single()

  const senderName = sender?.display_name ?? 'Someone'

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

  return new Response('ok', { status: 200 })
})
