export interface Profile {
  id: string
  onyen: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

export interface Listing {
  id: string
  user_id: string
  title: string
  description: string
  rent: number
  available_from: string
  available_to: string
  address: string
  lat: number | null
  lng: number | null
  bedrooms: number
  bathrooms: number
  is_furnished: boolean
  photos: string[]
  amenities: string[]
  is_active: boolean
  created_at: string
  profile?: Profile
}

export interface Message {
  id: string
  listing_id: string
  sender_id: string
  recipient_id: string
  body: string
  created_at: string
  read_at: string | null
}
