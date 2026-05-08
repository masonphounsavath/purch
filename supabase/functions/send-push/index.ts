import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import webpush from 'npm:web-push'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!

webpush.setVapidDetails('mailto:mason@purchit.org', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

Deno.serve(async (req) => {
  const { user_id, title, body, url } = await req.json()

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user_id)

  if (!subs?.length) return new Response('no subscriptions', { status: 200 })

  const payload = JSON.stringify({ title, body, url: url ?? 'https://purchit.org/messages' })

  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  return new Response('ok', { status: 200 })
})
