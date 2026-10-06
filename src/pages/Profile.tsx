import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LogOut, Plus, MapPin, Calendar, Pencil, Trash2,
  Camera, MessageSquare, Heart, Settings, Home, Phone, Eye, BadgeCheck, Loader, PartyPopper,
} from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { button, cardHeading, field, fieldHint, fieldLabel } from '../components/ui/styles'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
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

  async function updateListing(id: string, patch: Partial<Listing>) {
    const { data } = await supabase
      .from('listings').update(patch)
      .eq('id', id).select().single()
    if (data) setListings(prev => prev.map(l => l.id === id ? data : l))
  }

  // Archive: off the market for a mundane reason (today's old "Deactivate")
  const handleArchive = (listing: Listing) =>
    updateListing(listing.id, { is_active: false, purched_at: null })

  // Purch'd!: off the market because it was taken via Purch — counts toward the public stat
  function handlePurched(listing: Listing) {
    if (!confirm("Mark this listing as Purch'd? It'll come down from Browse and count as a sublease filled through Purch.")) return
    updateListing(listing.id, { is_active: false, purched_at: new Date().toISOString() })
  }

  // A live listing can't also be a past success, so reactivating clears the flag
  const handleReactivate = (listing: Listing) =>
    updateListing(listing.id, { is_active: true, purched_at: null })

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

  const tabs = [
    { id: 'listings', label: 'My listings', icon: Home },
    { id: 'saved',    label: 'Saved',       icon: Heart },
    { id: 'settings', label: 'Settings',    icon: Settings },
  ] as const

  const thumb = (listing: Listing) => (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-brand-navy flex-shrink-0">
      {listing.photos?.[0]
        ? <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center"><img src="/brand/purch_exact_mark.svg" alt="" className="h-8 w-auto" /></div>
      }
    </div>
  )

  const secondaryAction = 'text-sm font-semibold border border-brand-line rounded-[10px] px-3.5 py-2 text-brand-navy hover:border-brand-sky hover:text-brand-sky-ink transition-colors'
  const iconButton ='p-2.5 rounded-[10px] border border-brand-line text-brand-muted hover:border-brand-sky hover:text-brand-sky-ink transition-colors'

  return (
    <PageShell>
      {/* Identity band */}
      <section className="bg-brand-navy text-white">
        <div className="mx-auto max-w-4xl px-5 sm:px-8 pt-10 lg:pt-14 pb-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-5 min-w-0">

              {/* Avatar with upload button */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-brand-sky flex items-center justify-center text-brand-navy font-outfit text-3xl font-extrabold ring-4 ring-brand-navy-2 overflow-hidden">
                  {profileData.avatar_url
                    ? <img src={profileData.avatar_url} alt="" className="w-full h-full object-cover" />
                    : displayName.slice(0, 2).toUpperCase()
                  }
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-[0_2px_8px_rgba(5,30,55,0.3)] flex items-center justify-center text-brand-navy hover:bg-brand-mist transition-colors"
                  title="Change photo"
                  aria-label="Change photo"
                >
                  {avatarUploading
                    ? <span className="w-3.5 h-3.5 border-2 border-brand-sky border-t-transparent rounded-full animate-spin" />
                    : <Camera className="w-4 h-4" />
                  }
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              {/* Identity */}
              <div className="min-w-0 flex flex-col gap-1.5">
                <h1 className="font-outfit text-3xl sm:text-[40px] leading-none font-extrabold tracking-[-0.03em] truncate">{displayName}</h1>
                <p className="text-[15px] text-brand-subtle truncate">{email}</p>
                <div className="flex items-center gap-x-4 gap-y-1.5 mt-1 flex-wrap text-[13px] text-brand-subtle">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-sky text-brand-navy font-bold">
                    <BadgeCheck className="w-3.5 h-3.5" /> UNC Verified
                  </span>
                  {memberSince && <span>Member since {memberSince}</span>}
                  {profileData.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {profileData.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="hidden sm:flex items-center gap-2 text-[15px] font-semibold text-brand-subtle hover:text-white border border-white/20 hover:bg-white/10 rounded-[10px] px-4 py-2.5 transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>

          {/* Stats row */}
          <div className="mt-8 pt-6 border-t border-brand-navy-2 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-10">
              {[
                { n: listings.length, l: 'Listings' },
                { n: activeCount,     l: 'Active' },
                { n: savedIds.length, l: 'Saved' },
              ].map(s => (
                <div key={s.l}>
                  <p className="font-outfit text-[32px] font-extrabold leading-none">{s.n}</p>
                  <p className="text-[12px] font-semibold tracking-[0.2em] uppercase text-brand-subtle mt-1.5">{s.l}</p>
                </div>
              ))}
            </div>
            <Link to="/messages" className={button('primary', 'sm', 'sm:ml-auto self-start sm:self-center')}>
              <MessageSquare className="w-4 h-4" />
              Messages
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 sm:px-8 py-8 lg:py-10">

        {/* Tab bar */}
        <div role="tablist" className="flex gap-1 rounded-[14px] bg-brand-mist p-1 mb-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-[15px] font-semibold rounded-[10px] transition-colors',
                tab === id ? 'bg-brand-navy text-white shadow-sm' : 'text-brand-muted hover:text-brand-navy',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── My Listings tab ── */}
        {tab === 'listings' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className={cardHeading}>My listings</h2>
              <Link to="/post" className={button('dark', 'sm')}>
                <Plus className="w-4 h-4" /> Post listing
              </Link>
            </div>

            {listingsLoading ? (
              <div className="flex justify-center py-16"><Loader className="w-5 h-5 text-brand-sky animate-spin" /></div>
            ) : listings.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No listings yet"
                body="Post your first sublease and reach hundreds of UNC students."
                action={<Link to="/post" className={button('primary', 'sm')}><Plus className="w-4 h-4" /> Post a listing</Link>}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {listings.map(listing => (
                  <div key={listing.id} className="rounded-2xl border border-brand-line bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {thumb(listing)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={`/listings/${listing.id}`} className="font-bold truncate hover:text-brand-sky-ink transition-colors">{listing.title}</Link>
                          <span className={cn(
                            'text-xs px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0',
                            listing.is_active ? 'bg-brand-sky/15 text-brand-sky-ink' : 'bg-brand-mist text-brand-muted',
                          )}>
                            {listing.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {!listing.is_active && listing.purched_at && (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold flex-shrink-0 bg-brand-sky text-brand-navy">
                              <PartyPopper className="w-3 h-3" /> Purch'd!
                            </span>
                          )}
                        </div>
                        <p className="font-outfit text-lg font-extrabold leading-tight">${listing.rent.toLocaleString()}<span className="font-figtree text-xs font-medium text-brand-muted">/mo</span></p>
                        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[13px] text-brand-muted mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(listing.available_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' – '}
                            {new Date(listing.available_to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {listing.view_count ?? 0} {(listing.view_count ?? 0) === 1 ? 'view' : 'views'}
                          </span>
                          {(inquiryCounts[listing.id] ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-brand-sky-ink font-semibold">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {inquiryCounts[listing.id]} {inquiryCounts[listing.id] === 1 ? 'inquiry' : 'inquiries'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                      {listing.is_active ? (
                        <>
                          <button
                            onClick={() => handlePurched(listing)}
                            className="inline-flex items-center gap-1.5 text-sm font-bold rounded-[10px] px-3.5 py-2 bg-brand-sky text-brand-navy hover:bg-brand-navy hover:text-brand-sky transition-colors"
                          >
                            <PartyPopper className="w-4 h-4" /> Purch'd!
                          </button>
                          <button
                            onClick={() => handleArchive(listing)}
                            className={secondaryAction}
                          >
                            Archive
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleReactivate(listing)}
                          className={secondaryAction}
                        >
                          Reactivate
                        </button>
                      )}
                      <Link to={`/listings/${listing.id}/edit`} className={iconButton} aria-label="Edit listing">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        disabled={deleting === listing.id}
                        aria-label="Delete listing"
                        className="p-2.5 rounded-[10px] border border-brand-line text-brand-muted hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-40"
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
            <h2 className={cn(cardHeading, 'mb-5')}>Saved listings</h2>
            {savedLoading ? (
              <div className="flex justify-center py-16"><Loader className="w-5 h-5 text-brand-sky animate-spin" /></div>
            ) : savedListings.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No saved listings"
                body="Tap the heart on any listing to save it for later."
                action={<Link to="/browse" className={button('primary', 'sm')}>Browse listings</Link>}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {savedListings.map(listing => (
                  <div key={listing.id} className="rounded-2xl border border-brand-line bg-white p-4 sm:p-5 flex items-center gap-4">
                    {thumb(listing)}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate mb-0.5">{listing.title}</p>
                      <p className="font-outfit text-lg font-extrabold leading-tight">${listing.rent.toLocaleString()}<span className="font-figtree text-xs font-medium text-brand-muted">/mo</span></p>
                      <p className="flex items-center gap-1 text-[13px] text-brand-muted mt-1 truncate">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {listing.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/listings/${listing.id}`}
                        className="text-sm font-semibold border border-brand-line rounded-[10px] px-3.5 py-2 text-brand-navy hover:border-brand-sky hover:text-brand-sky-ink transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleUnsave(listing.id)}
                        className="p-2.5 rounded-[10px] border border-brand-line text-brand-sky hover:bg-brand-mist transition-colors"
                        title="Unsave"
                        aria-label="Remove from saved"
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
          <div className="rounded-2xl border border-brand-line bg-white p-6 sm:p-8">
            <h2 className={cn(cardHeading, 'mb-6')}>Profile settings</h2>
            <div className="space-y-5 max-w-md">
              <div>
                <label className={fieldLabel}>Display name</label>
                <input
                  type="text"
                  value={settingsForm.display_name}
                  onChange={e => setSettingsForm(p => ({ ...p, display_name: e.target.value }))}
                  placeholder="Your name"
                  className={field}
                />
              </div>
              <div>
                <label className={fieldLabel}>Phone number</label>
                <input
                  type="tel"
                  value={settingsForm.phone}
                  onChange={e => setSettingsForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="(919) 555-0000"
                  className={field}
                />
                <p className={fieldHint}>Optional. Visible on your profile to interested renters.</p>
              </div>
              <div>
                <label className={fieldLabel}>Notification email</label>
                <input
                  type="email"
                  value={settingsForm.notification_email}
                  onChange={e => setSettingsForm(p => ({ ...p, notification_email: e.target.value }))}
                  placeholder="yourname@gmail.com"
                  className={field}
                />
                <p className={fieldHint}>Personal email for message notifications — Gmail recommended. UNC email often misses them.</p>
              </div>
              <div>
                <label className={fieldLabel}>UNC email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className={cn(field, 'bg-brand-mist text-brand-muted cursor-not-allowed')}
                />
                <p className={fieldHint}>Cannot be changed.</p>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className={button('primary', 'sm')}
              >
                {settingsSaving ? 'Saving…' : settingsSaved ? 'Saved!' : 'Save changes'}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-brand-line">
              <p className="font-bold mb-1">Sign out</p>
              <p className="text-sm text-brand-muted mb-3">You'll be redirected to the home page.</p>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-[10px] px-4 py-2.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}

function EmptyState({ icon: Icon, title, body, action }: {
  icon: typeof Heart
  title: string
  body: string
  action: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-brand-mist p-10 sm:p-14 text-center flex flex-col items-center">
      <span className="w-12 h-12 rounded-[12px] bg-brand-navy text-brand-sky flex items-center justify-center mb-4">
        <Icon className="w-5 h-5" />
      </span>
      <p className="font-outfit text-xl font-bold mb-1">{title}</p>
      <p className="text-[15px] text-brand-muted mb-6 max-w-[340px]">{body}</p>
      {action}
    </div>
  )
}
