import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useUnreadCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user?.id) { setCount(0); return }
    const uid = user.id

    async function fetchCount() {
      try {
        const { count: n } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', uid)
          .is('read_at', null)
        setCount(n ?? 0)
      } catch { /* ignore */ }
    }
    fetchCount()

    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel(`unread:${uid}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${uid}` }, fetchCount)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `recipient_id=eq.${uid}` }, fetchCount)
        .subscribe()
    } catch { /* real-time unavailable — query fallback is fine */ }

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [user?.id])

  return count
}
