import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LogOut, Plus, MapPin, Calendar, Pencil, Trash2,
  Camera, MessageSquare, Heart, Settings, Home, Phone, Star,
} from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { Listing } from '../types'

type Tab = 'listings' | 'saved' | 'settings'

interface ProfileData {
  display_name: string
  avatar_url: string | null
  phone: string | null
  created_at: string
}

export default function Profile() {
  const { user, isAuthed, loading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<Tab>('listings')
  const [profileData, setProfileData] = useState<ProfileData>({ display_name: '', avatar_url: null, phone: null, created_at: '' })
  const [listings, setListings] = useState<Listing[]>([])
  const [savedListings, setSavedListings] = useState<Listing[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [savedListingsLoaded, setSavedListingsLoaded] = useState(false)
  const [inquiryCounts, setInquiryCounts] = useState<Record<string, number>>({})
  const [listingsLoading, setListingsLoading] = useState(true)
  const [savedLoading, setSavedLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ display_name: '', phone: '' })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthed) navigate('/')
  }, [loading, isAuthed, navigate])

  useEffect(() => {
    if (!user) return

    async function fetchProfile() {
      const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
      if (data) {
        setProfileData(data)
        setSettingsForm({ display_name: data.display_name ?? '', phone: data.phone ?? '' })
      }
    }

    async function fetchMyListings() {
      setListingsLoading(true)
      const { data } = await supabase
        .from('listings').select('*').eq('user_id', user!.id).order('created_at', { ascending: false })
      setListings(data ?? [])

      if (data && data.length > 0) {
        const listingIds = data.map(l => l.id)
        const { data: msgs } = await supabase
          .from('messages').select('listing_id, sender_id')
          .in('listing_id', listingIds).neq('sender_id', user!.id)
        if (msgs) {
          const sets: Record<string, Set<string>> = {}
          msgs.forEach(m => {
            if (!sets[m.listing_id]) sets[m.listing_id] = new Set()
            sets[m.listing_id].add(m.sender_id)
          })
          const counts: Record<string, number> = {}
          Object.entries(sets).forEach(([id, s]) => { counts[id] = s.size })
          setInquiryCounts(counts)
        }
      }
      setListingsLoading(false)
    }

    async function fetchSavedIds() {
      const { data } = await supabase.from('saved_listings').select('listing_id').eq('user_id', user!.id)
      setSavedIds(data?.map(s => s.listing_id) ?? [])
    }

    fetchProfile()
    fetchMyListings()
    fetchSavedIds()
  }, [user])

  useEffect(() => {
    if (tab !== 'saved' || !user || savedListingsLoaded) return
    async function fetchSavedListings() {
      setSavedLoading(true)
      const { data } = await supabase
        .from('saved_listings')
        .select('listing_id, listings(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      setSavedListings(data?.map((s: any) => s.listings).filter(Boolean) ?? [])
      setSavedListingsLoaded(true)
      setSavedLoading(false)
    }
    fetchSavedListings()
  }, [tab, user, savedListingsLoaded])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setDeleting(id)
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
    setDeleting(null)
  }

  async function handleToggleActive(listing: Listing) {
    const { data } = await supabase
      .from('listings').update({ is_active: !listing.is_active })
      .eq('id', listing.id).select().single()
    if (data) setListings(prev => prev.map(l => l.id === listing.id ? data : l))
  }

  async function handleUnsave(listingId: string) {
    await supabase.from('saved_listings').delete()
      .eq('user_id', user!.id).eq('listing_id', listingId)
    setSavedListings(prev => prev.filter(l => l.id !== listingId))
    setSavedIds(prev => prev.filter(id => id !== listingId))
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setAvatarUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    await supabase.storage.from('listing-photos').upload(path, file, { upsert: true })
    const { data } = supabase.storage.from('listing-photos').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
    setProfileData(prev => ({ ...prev, avatar_url: data.publicUrl }))
    setAvatarUploading(false)
  }

  async function handleSaveSettings() {
    if (!user) return
    setSettingsSaving(true)
    await supabase.from('profiles').update({
      display_name: settingsForm.display_name,
      phone: settingsForm.phone || null,
    }).eq('id', user.id)
    setProfileData(prev => ({ ...prev, display_name: settingsForm.display_name, phone: settingsForm.phone || null }))
    setSettingsSaving(false)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  if (loading) return null

  const email = user?.email ?? ''
  const activeCount = listings.filter(l => l.is_active).length
  const memberSince = profileData.created_at
    ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null
  const displayName = profileData.display_name || email.split('@')[0]

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-14">

        {/* Hero banner */}
        <div className="bg-gradient-to-r from-unc-navy to-unc-blue h-32" />

        <div className="max-w-4xl mx-auto px-6">

          {/* Profile card — overlaps banner */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm -mt-10 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-end gap-5">

                {/* Avatar with upload button */}
                <div className="relative -mt-14">
                  <div className="w-20 h-20 rounded-full bg-unc-blue flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white overflow-hidden shadow-md">
                    {profileData.avatar_url
                      ? <img src={profileData.avatar_url} alt="" className="w-full h-full object-cover" />
                      : displayName.slice(0, 2).toUpperCase()
                    }
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
                    title="Change photo"
                  >
                    {avatarUploading
                      ? <span className="w-3 h-3 border-2 border-unc-blue border-t-transparent rounded-full animate-spin" />
                      : <Camera className="w-3 h-3 text-gray-500" />
                    }
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </div>

                {/* Identity */}
                <div className="pb-1">
                  <h1 className="text-xl font-bold text-unc-navy">{displayName}</h1>
                  <p className="text-sm text-slate-body">{email}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                      <Star className="w-3 h-3 fill-current" /> UNC Verified
                    </span>
                    {memberSince && (
                      <span className="text-xs text-slate-body">Member since {memberSince}</span>
                    )}
                    {profileData.phone && (
                      <span className="flex items-center gap-1 text-xs text-slate-body">
                        <Phone className="w-3 h-3" /> {profileData.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-2 text-sm text-slate-body hover:text-red-500 transition-colors border border-gray-200 hover:border-red-200 rounded-lg px-4 py-2 mt-1 flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>

            {/* Stats row */}
            <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-xl font-bold text-unc-navy leading-none">{listings.length}</p>
                  <p className="text-xs text-slate-body mt-0.5">Listings</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-unc-navy leading-none">{activeCount}</p>
                  <p className="text-xs text-slate-body mt-0.5">Active</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-unc-navy leading-none">{savedIds.length}</p>
                  <p className="text-xs text-slate-body mt-0.5">Saved</p>
                </div>
              </div>
              <div className="sm:ml-auto">
                <Link
                  to="/messages"
                  className="inline-flex items-center gap-2 text-sm font-medium text-unc-blue border border-unc-blue/30 hover:bg-unc-blue/5 rounded-lg px-4 py-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1 mb-6">
            {([
              { id: 'listings', label: 'My Listings', icon: Home },
              { id: 'saved',    label: 'Saved',       icon: Heart },
              { id: 'settings', label: 'Settings',    icon: Settings },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  tab === id ? 'bg-unc-blue text-white' : 'text-slate-body hover:text-unc-navy'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ── My Listings tab ── */}
          {tab === 'listings' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-unc-navy">My listings</h2>
                <Link
                  to="/post"
                  className="flex items-center gap-2 bg-unc-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-unc-navy transition-colors"
                >
                  <Plus className="w-4 h-4" /> Post listing
                </Link>
              </div>

              {listingsLoading ? (
                <div className="text-slate-body text-sm py-12 text-center">Loading…</div>
              ) : listings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-5 h-5 text-unc-blue" />
                  </div>
                  <p className="font-semibold text-unc-navy mb-1">No listings yet</p>
                  <p className="text-sm text-slate-body mb-5">Post your first sublease and reach hundreds of UNC students.</p>
                  <Link to="/post" className="inline-flex items-center gap-2 bg-unc-blue text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-unc-navy transition-colors">
                    <Plus className="w-4 h-4" /> Post a listing
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {listings.map(listing => (
                    <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {listing.photos?.[0]
                          ? <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><MapPin className="w-5 h-5 text-gray-300" /></div>
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-unc-navy truncate">{listing.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            listing.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {listing.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-unc-blue font-semibold text-sm">${listing.rent}/mo</p>
                        <div className="flex items-center gap-3 text-xs text-slate-body mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(listing.available_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' – '}
                            {new Date(listing.available_to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          {(inquiryCounts[listing.id] ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-unc-blue font-medium">
                              <MessageSquare className="w-3 h-3" />
                              {inquiryCounts[listing.id]} {inquiryCounts[listing.id] === 1 ? 'inquiry' : 'inquiries'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggleActive(listing)}
                          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-slate-body hover:border-unc-blue hover:text-unc-blue transition-colors"
                        >
                          {listing.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <Link
                          to={`/listings/${listing.id}/edit`}
                          className="p-2 rounded-lg border border-gray-200 text-slate-body hover:border-unc-blue hover:text-unc-blue transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          disabled={deleting === listing.id}
                          className="p-2 rounded-lg border border-gray-200 text-slate-body hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Saved tab ── */}
          {tab === 'saved' && (
            <div>
              <h2 className="text-lg font-semibold text-unc-navy mb-4">Saved listings</h2>
              {savedLoading ? (
                <div className="text-slate-body text-sm py-12 text-center">Loading…</div>
              ) : savedListings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-5 h-5 text-unc-blue" />
                  </div>
                  <p className="font-semibold text-unc-navy mb-1">No saved listings</p>
                  <p className="text-sm text-slate-body mb-5">Tap the heart on any listing to save it for later.</p>
                  <Link to="/browse" className="inline-flex items-center gap-2 bg-unc-blue text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-unc-navy transition-colors">
                    Browse listings
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {savedListings.map(listing => (
                    <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {listing.photos?.[0]
                          ? <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><MapPin className="w-5 h-5 text-gray-300" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-unc-navy truncate mb-0.5">{listing.title}</p>
                        <p className="text-unc-blue font-semibold text-sm">${listing.rent}/mo</p>
                        <p className="flex items-center gap-1 text-xs text-slate-body mt-0.5">
                          <MapPin className="w-3 h-3" /> {listing.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          to={`/listings/${listing.id}`}
                          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-slate-body hover:border-unc-blue hover:text-unc-blue transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleUnsave(listing.id)}
                          className="p-2 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition-colors"
                          title="Unsave"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Settings tab ── */}
          {tab === 'settings' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-unc-navy mb-6">Profile settings</h2>
              <div className="space-y-5 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-unc-navy mb-1.5">Display name</label>
                  <input
                    type="text"
                    value={settingsForm.display_name}
                    onChange={e => setSettingsForm(p => ({ ...p, display_name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-unc-navy mb-1.5">Phone number</label>
                  <input
                    type="tel"
                    value={settingsForm.phone}
                    onChange={e => setSettingsForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="(919) 555-0000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue"
                  />
                  <p className="text-xs text-slate-body mt-1">Optional. Visible on your profile to interested renters.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-unc-navy mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm text-slate-body bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-body mt-1">UNC email — cannot be changed.</p>
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  className="bg-unc-blue text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-unc-navy transition-colors disabled:opacity-60"
                >
                  {settingsSaving ? 'Saving…' : settingsSaved ? 'Saved!' : 'Save changes'}
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-sm font-medium text-unc-navy mb-1">Sign out</p>
                <p className="text-sm text-slate-body mb-3">You'll be redirected to the home page.</p>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-sm text-red-500 border border-red-200 hover:bg-red-50 rounded-lg px-4 py-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}

          <div className="pb-10" />
        </div>
      </div>
    </>
  )
}
