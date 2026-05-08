import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LogOut, Plus, MapPin, Calendar, Pencil, Trash2,
  Camera, MessageSquare, Heart, Settings, Home, Phone, Star, Eye,
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
  notification_email: string | null
  created_at: string
}

export default function Profile() {
  const { user, isAuthed, loading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<Tab>('listings')
  const [profileData, setProfileData] = useState<ProfileData>({ display_name: '', avatar_url: null, phone: null, notification_email: null, created_at: '' })
  const [listings, setListings] = useState<Listing[]>([])
  const [savedListings, setSavedListings] = useState<Listing[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [savedListingsLoaded, setSavedListingsLoaded] = useState(false)
  const [inquiryCounts, setInquiryCounts] = useState<Record<string, number>>({})
  const [listingsLoading, setListingsLoading] = useState(true)
  const [savedLoading, setSavedLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ display_name: '', phone: '', notification_email: '' })
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
        setSettingsForm({ display_name: data.display_name ?? '', phone: data.phone ?? '', notification_email: data.notification_email ?? '' })
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
      notification_email: settingsForm.notification_email || null,
    }).eq('id', user.id)
    setProfileData(prev => ({
      ...prev,
      display_name: settingsForm.display_name,
      phone: settingsForm.phone || null,
      notification_email: settingsForm.notification_email || null,
    }))
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
      <div className="min-h-screen pt-14">

        {/* Hero banner */}
        <div className="bg-[var(--ink)] h-32" />

        <div className="max-w-4xl mx-auto px-6">

          {/* Profile card — overlaps banner */}
          <div className="surface-paper rounded-2xl border hairline shadow-sm -mt-10 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-end gap-5">

                {/* Avatar with upload button */}
                <div className="relative -mt-14">
                  <div className="w-20 h-20 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--bg)] text-2xl font-bold ring-4 ring-[var(--paper)] overflow-hidden shadow-md">
                    {profileData.avatar_url
                      ? <img src={profileData.avatar_url} alt="" className="w-full h-full object-cover" />
                      : displayName.slice(0, 2).toUpperCase()
                    }
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-6 h-6 surface-paper rounded-full border hairline shadow flex items-center justify-center hover:surface-bg-2 transition-colors"
                    title="Change photo"
                  >
                    {avatarUploading
                      ? <span className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                      : <Camera className="w-3 h-3 text-muted" />
                    }
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </div>

                {/* Identity */}
                <div className="pb-1">
                  <h1 className="text-xl font-bold font-display">{displayName}</h1>
                  <p className="text-sm text-muted">{email}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs text-accent bg-[var(--accent)]/10 px-2 py-0.5 rounded-full font-medium">
                      <Star className="w-3 h-3 fill-current" /> UNC Verified
                    </span>
                    {memberSince && (
                      <span className="text-xs text-muted">Member since {memberSince}</span>
                    )}
                    {profileData.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Phone className="w-3 h-3" /> {profileData.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-2 text-sm text-muted hover:text-red-500 transition-colors border hairline hover:border-red-200 rounded-lg px-4 py-2 mt-1 flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>

            {/* Stats row */}
            <div className="mt-5 pt-5 border-t hairline flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-xl font-bold font-display leading-none">{listings.length}</p>
                  <p className="text-xs text-muted mt-0.5">Listings</p>
                </div>
                <div>
                  <p className="text-xl font-bold font-display leading-none">{activeCount}</p>
                  <p className="text-xs text-muted mt-0.5">Active</p>
                </div>
                <div>
                  <p className="text-xl font-bold font-display leading-none">{savedIds.length}</p>
                  <p className="text-xs text-muted mt-0.5">Saved</p>
                </div>
              </div>
              <div className="sm:ml-auto">
                <Link
                  to="/messages"
                  className="inline-flex items-center gap-2 text-sm font-medium text-accent border border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 rounded-lg px-4 py-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 surface-paper rounded-xl border hairline shadow-sm p-1 mb-6">
            {([
              { id: 'listings', label: 'My Listings', icon: Home },
              { id: 'saved',    label: 'Saved',       icon: Heart },
              { id: 'settings', label: 'Settings',    icon: Settings },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  tab === id ? 'bg-[var(--ink)] text-[var(--bg)]' : 'text-muted hover:text-ink'
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
                <h2 className="text-lg font-semibold font-display">My listings</h2>
                <Link
                  to="/post"
                  className="flex items-center gap-2 bg-[var(--ink)] text-[var(--bg)] text-sm font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" /> Post listing
                </Link>
              </div>

              {listingsLoading ? (
                <div className="text-muted text-sm py-12 text-center">Loading…</div>
              ) : listings.length === 0 ? (
                <div className="surface-paper rounded-2xl border hairline shadow-sm p-12 text-center">
                  <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <p className="font-semibold mb-1">No listings yet</p>
                  <p className="text-sm text-muted mb-5">Post your first sublease and reach hundreds of UNC students.</p>
                  <Link to="/post" className="inline-flex items-center gap-2 bg-[var(--ink)] text-[var(--bg)] text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
                    <Plus className="w-4 h-4" /> Post a listing
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {listings.map(listing => (
                    <div key={listing.id} className="surface-paper rounded-2xl border hairline shadow-sm p-5 flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden surface-bg-2 flex-shrink-0">
                        {listing.photos?.[0]
                          ? <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><MapPin className="w-5 h-5 text-muted" /></div>
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold truncate">{listing.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            listing.is_active ? 'bg-[var(--accent)]/10 text-accent' : 'surface-bg-2 text-muted'
                          }`}>
                            {listing.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-accent font-semibold text-sm">${listing.rent}/mo</p>
                        <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(listing.available_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' – '}
                            {new Date(listing.available_to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {listing.view_count ?? 0} {(listing.view_count ?? 0) === 1 ? 'view' : 'views'}
                          </span>
                          {(inquiryCounts[listing.id] ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-accent font-medium">
                              <MessageSquare className="w-3 h-3" />
                              {inquiryCounts[listing.id]} {inquiryCounts[listing.id] === 1 ? 'inquiry' : 'inquiries'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggleActive(listing)}
                          className="text-xs border hairline rounded-lg px-3 py-1.5 text-muted hover:border-[var(--accent)] hover:text-accent transition-colors"
                        >
                          {listing.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <Link
                          to={`/listings/${listing.id}/edit`}
                          className="p-2 rounded-lg border hairline text-muted hover:border-[var(--accent)] hover:text-accent transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          disabled={deleting === listing.id}
                          className="p-2 rounded-lg border hairline text-muted hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40"
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
              <h2 className="text-lg font-semibold font-display mb-4">Saved listings</h2>
              {savedLoading ? (
                <div className="text-muted text-sm py-12 text-center">Loading…</div>
              ) : savedListings.length === 0 ? (
                <div className="surface-paper rounded-2xl border hairline shadow-sm p-12 text-center">
                  <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-5 h-5 text-accent" />
                  </div>
                  <p className="font-semibold mb-1">No saved listings</p>
                  <p className="text-sm text-muted mb-5">Tap the heart on any listing to save it for later.</p>
                  <Link to="/browse" className="inline-flex items-center gap-2 bg-[var(--ink)] text-[var(--bg)] text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
                    Browse listings
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {savedListings.map(listing => (
                    <div key={listing.id} className="surface-paper rounded-2xl border hairline shadow-sm p-5 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden surface-bg-2 flex-shrink-0">
                        {listing.photos?.[0]
                          ? <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><MapPin className="w-5 h-5 text-muted" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate mb-0.5">{listing.title}</p>
                        <p className="text-accent font-semibold text-sm">${listing.rent}/mo</p>
                        <p className="flex items-center gap-1 text-xs text-muted mt-0.5">
                          <MapPin className="w-3 h-3" /> {listing.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          to={`/listings/${listing.id}`}
                          className="text-xs border hairline rounded-lg px-3 py-1.5 text-muted hover:border-[var(--accent)] hover:text-accent transition-colors"
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
            <div className="surface-paper rounded-2xl border hairline shadow-sm p-6">
              <h2 className="text-lg font-semibold font-display mb-6">Profile settings</h2>
              <div className="space-y-5 max-w-md">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Display name</label>
                  <input
                    type="text"
                    value={settingsForm.display_name}
                    onChange={e => setSettingsForm(p => ({ ...p, display_name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full border hairline rounded-lg px-3 py-2 text-sm surface-paper focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone number</label>
                  <input
                    type="tel"
                    value={settingsForm.phone}
                    onChange={e => setSettingsForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="(919) 555-0000"
                    className="w-full border hairline rounded-lg px-3 py-2 text-sm surface-paper focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
                  />
                  <p className="text-xs text-muted mt-1">Optional. Visible on your profile to interested renters.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Notification email</label>
                  <input
                    type="email"
                    value={settingsForm.notification_email}
                    onChange={e => setSettingsForm(p => ({ ...p, notification_email: e.target.value }))}
                    placeholder="yourname@gmail.com"
                    className="w-full border hairline rounded-lg px-3 py-2 text-sm surface-paper focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
                  />
                  <p className="text-xs text-muted mt-1">Personal email for message notifications — Gmail recommended. UNC email often misses them.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">UNC email</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full border hairline rounded-lg px-3 py-2 text-sm text-muted surface-bg cursor-not-allowed"
                  />
                  <p className="text-xs text-muted mt-1">Cannot be changed.</p>
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  className="bg-[var(--ink)] text-[var(--bg)] text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {settingsSaving ? 'Saving…' : settingsSaved ? 'Saved!' : 'Save changes'}
                </button>
              </div>

              <div className="mt-8 pt-6 border-t hairline">
                <p className="text-sm font-medium mb-1">Sign out</p>
                <p className="text-sm text-muted mb-3">You'll be redirected to the home page.</p>
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
