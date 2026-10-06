import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Display-only shape returned by the recently_purched() RPC. Deliberately has no
// listing id — Purch'd listings are off the market and must never be linkable.
export interface PurchedItem {
  street: string
  rent: number
  bedrooms: number
  purched_at: string
}

// Below this, the public stat and strip stay hidden — "2 subleases Purch'd" reads
// as a weak signal, not social proof.
export const MIN_PUBLIC_PURCHED = 5

// Total listings marked Purch'd. null while loading or if the RPC isn't deployed.
export function usePurchedCount() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    supabase.rpc('purched_count').then(({ data, error }) => {
      if (!error && data != null) setCount(Number(data))
    })
  }, [])
  return count
}

// Most recently Purch'd listings, newest first.
export function useRecentlyPurched(limit = 8) {
  const [items, setItems] = useState<PurchedItem[]>([])
  useEffect(() => {
    supabase.rpc('recently_purched', { max_rows: limit }).then(({ data, error }) => {
      if (!error && data) setItems(data as PurchedItem[])
    })
  }, [limit])
  return items
}
