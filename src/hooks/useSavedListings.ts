import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useSavedListings() {
  const { user, isAuthed } = useAuth()
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthed || !user) {
      setSavedIds(new Set())
      setLoading(false)
      return
    }

    async function fetchSaved() {
      const { data } = await supabase
        .from('saved_listings')
        .select('listing_id')
        .eq('user_id', user!.id)
      setSavedIds(new Set(data?.map(s => s.listing_id) ?? []))
      setLoading(false)
    }
    fetchSaved()
  }, [user, isAuthed])

  async function toggleSave(listingId: string) {
    if (!user) return

    if (savedIds.has(listingId)) {
      setSavedIds(prev => { const next = new Set(prev); next.delete(listingId); return next })
      await supabase.from('saved_listings').delete()
        .eq('user_id', user.id).eq('listing_id', listingId)
    } else {
      setSavedIds(prev => new Set([...prev, listingId]))
      await supabase.from('saved_listings').insert({ user_id: user.id, listing_id: listingId })
    }
  }

  return { savedIds, toggleSave, loading }
}
