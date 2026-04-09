import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Listing } from '../types'

export interface Filters {
  minRent?: number
  maxRent?: number
  bedrooms?: number        // -1 = any
  furnished?: boolean
  availableFrom?: string
}

export function useListings(filters: Filters = {}) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      let query = supabase
        .from('listings')
        .select('*, profile:profiles(display_name, avatar_url)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (filters.minRent)      query = query.gte('rent', filters.minRent)
      if (filters.maxRent)      query = query.lte('rent', filters.maxRent)
      if (filters.bedrooms !== undefined && filters.bedrooms >= 0)
        query = filters.bedrooms >= 3
          ? query.gte('bedrooms', filters.bedrooms)
          : query.eq('bedrooms', filters.bedrooms)
      if (filters.furnished)    query = query.eq('is_furnished', true)
      if (filters.availableFrom) query = query.lte('available_from', filters.availableFrom)

      const { data, error } = await query
      if (error) setError(error.message)
      else setListings(data as Listing[])
      setLoading(false)
    }
    fetch()
  }, [
    filters.minRent,
    filters.maxRent,
    filters.bedrooms,
    filters.furnished,
    filters.availableFrom,
  ])

  return { listings, loading, error }
}
