import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = 'BFwSxxEBBDepjCpUukxQpEW-IfF2iX2jZxnLAOgGCw3fj7mP5XrkLSGq7BnFeX7zlY0mv9JnfikKlF3UJf8QgHg'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications(userId: string | undefined) {
  const [permission, setPermission] = useState<NotificationPermission | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  async function subscribe() {
    if (!userId) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const reg = await navigator.serviceWorker.register('/sw.js')
    const existing = await reg.pushManager.getSubscription()
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const json = sub.toJSON()
    await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: (json.keys as any)?.p256dh,
      auth: (json.keys as any)?.auth,
    }, { onConflict: 'user_id' })

    setPermission('granted')
  }

  async function requestPermission() {
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') await subscribe()
    return result
  }

  return { permission, requestPermission }
}
