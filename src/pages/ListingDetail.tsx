import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, Calendar, ChevronLeft,
  ChevronRight, MessageCircle, ArrowLeft, Pencil, Loader, Mail, Phone
} from 'lucide-react'

// Deterministic color from amenity string — always the same color per tag
const AMENITY_COLORS = [
  { bg: '#EEF2FF', text: '#4338CA' }, // indigo
  { bg: '#F0FDF4', text: '#15803D' }, // green
  { bg: '#FFF7ED', text: '#C2410C' }, // orange
  { bg: '#FDF4FF', text: '#A21CAF' }, // purple
  { bg: '#ECFDF5', text: '#065F46' }, // emerald
  { bg: '#FFF1F2', text: '#BE123C' }, // rose
  { bg: '#EFF6FF', text: '#1D4ED8' }, // blue
  { bg: '#FFFBEB', text: '#B45309' }, // amber
]

function amenityColor(tag: string) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0
  return AMENITY_COLORS[hash % AMENITY_COLORS.length]
}
import { Navbar } from '../components/layout/Navbar'
import { DetailMap } from '../components/map/DetailMap'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Listing } from '../types'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function PhotoGallery({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0)
  if (photos.length === 0) {
    return (
      <div className="aspect-[16/9] ph rounded-2xl flex items-center justify-center">
        <MapPin className="w-10 h-10 text-muted" />
      </div>
    )
  }
  return (
    <div className="relative">
      <div className="aspect-[16/9] rounded-2xl overflow-hidden surface-bg-2">
        <img src={photos[idx]} alt="" className="w-full h-full object-cover" />
      </div>
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 surface-paper rounded-full flex items-center justify-center shadow hover:opacity-90 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-ink" />
          </button>
          <button
            onClick={() => setIdx(i => (i + 1) % photos.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 surface-paper rounded-full flex items-center justify-center shadow hover:opacity-90 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-ink" />
          </button>
          <div className="flex justify-center gap-1.5 mt-3">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-[var(--ink)]' : 'bg-[var(--line)]'}`}
              />
            ))}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {photos.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === idx ? 'border-[var(--ink)]' : 'border-transparent'}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthed } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [msgBody, setMsgBody] = useState('')
  const [msgSent, setMsgSent] = useState(false)
  const [msgLoading, setMsgLoading] = useState(false)
  const [showMsgBox, setShowMsgBox] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('listings')
      .select('*, profile:profiles(display_name, avatar_url, phone, email)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else {
          setListing(data as Listing)
          // Increment view count for non-owners (best effort)
          if (data && user?.id !== data.user_id) {
            supabase.rpc('increment_view_count', { listing_uuid: id })
          }
        }
        setLoading(false)
      })
  }, [id, user])

  async function sendMessage() {
    if (!user || !listing || !msgBody.trim()) return
    setMsgLoading(true)
    const { error } = await supabase.from('messages').insert({
      listing_id:   listing.id,
      sender_id:    user.id,
      recipient_id: listing.user_id,
      body:         msgBody.trim(),
    })
    setMsgLoading(false)
    if (!error) {
      setMsgSent(true)
      setMsgBody('')
    }
  }

  const isOwner = user?.id === listing?.user_id

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <Loader className="w-6 h-6 text-accent animate-spin" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 pt-40 text-center">
          <p className="text-2xl font-bold font-display mb-2">Listing not found</p>
          <p className="text-muted mb-6">It may have been removed or deactivated.</p>
          <Link to="/browse" className="text-accent font-medium hover:underline">← Back to browse</Link>
        </div>
      </div>
    )
  }

  if (!listing) return null

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-20">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left: photos + details */}
          <div className="lg:col-span-2 space-y-8">
            <PhotoGallery photos={listing.photos ?? []} />

            {/* Title row */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1
                  className="font-display leading-snug"
                  style={{ fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)' }}
                >
                  {listing.title}
                </h1>
                <p className="flex items-center gap-1 mt-1.5 font-mono text-[12px]" style={{ color: 'var(--muted)' }}>
                  <MapPin className="w-3 h-3" /> {listing.address}
                </p>
              </div>
              {isOwner && (
                <Link
                  to={`/listings/${listing.id}/edit`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink border hairline px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Link>
              )}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Bedrooms', value: listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed` },
                { label: 'Bathrooms', value: `${listing.bathrooms} bath` },
                { label: 'Furnished', value: listing.is_furnished ? 'Yes' : 'No' },
                { label: 'Monthly rent', value: `$${listing.rent.toLocaleString()}` },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl p-3" style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}>
                  <p className="font-mono uppercase text-[9.5px] tracking-[0.14em] mb-1.5" style={{ color: 'var(--muted)' }}>{stat.label}</p>
                  <p className="font-display text-[17px]" style={{ fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Availability */}
            <div className="flex items-center gap-3" style={{ color: 'var(--ink-2)' }}>
              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="text-[14px]">Available <strong className="font-semibold" style={{ color: 'var(--ink)' }}>{formatDate(listing.available_from)}</strong> through <strong className="font-semibold" style={{ color: 'var(--ink)' }}>{formatDate(listing.available_to)}</strong></span>
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="font-mono uppercase text-[10.5px] tracking-[0.14em] mb-3" style={{ color: 'var(--muted)' }}>About this place</h2>
                <p className="leading-relaxed text-[15px] whitespace-pre-line" style={{ color: 'var(--ink-2)' }}>{listing.description}</p>
              </div>
            )}

            {/* Amenities */}
            {listing.amenities?.length > 0 && (
              <div>
                <h2 className="font-mono uppercase text-[10.5px] tracking-[0.14em] mb-3" style={{ color: 'var(--muted)' }}>Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map(tag => {
                    const c = amenityColor(tag)
                    return (
                      <span
                        key={tag}
                        className="inline-flex items-center text-[12.5px] font-mono font-medium px-3 py-1.5 rounded-full"
                        style={{ background: c.bg, color: c.text }}
                      >
                        {tag}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Location map */}
            {listing.lat != null && listing.lng != null && (
              <div>
                <h2 className="font-mono uppercase text-[10.5px] tracking-[0.14em] mb-3" style={{ color: 'var(--muted)' }}>Location</h2>
                <DetailMap lat={listing.lat} lng={listing.lng} />
                <p className="text-xs text-muted mt-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {listing.address}
                </p>
              </div>
            )}
          </div>

          {/* Right: sticky contact card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 surface-paper border hairline rounded-2xl shadow-sm p-6 space-y-5">
              <div>
                <span className="text-3xl font-bold font-display">${listing.rent.toLocaleString()}</span>
                <span className="text-muted text-sm">/month</span>
              </div>

              <div className="border-t hairline pt-4">
                <p className="font-mono uppercase text-[9.5px] tracking-[0.14em] mb-1.5" style={{ color: 'var(--muted)' }}>Posted by</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-xs font-bold text-accent">
                    {(listing.profile?.display_name ?? 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">
                    {listing.profile?.display_name ?? 'UNC Student'}
                  </span>
                </div>
              </div>

              {!isOwner && (
                <div className="border-t hairline pt-4">
                  {!isAuthed ? (
                    <p className="text-sm text-muted text-center">
                      <Link to="/" className="text-accent font-medium hover:underline">Sign in</Link> to message this student.
                    </p>
                  ) : msgSent ? (
                    <div className="text-center py-2">
                      <div className="w-10 h-10 bg-[var(--accent)]/15 rounded-full flex items-center justify-center mx-auto mb-2">
                        <MessageCircle className="w-5 h-5 text-accent" />
                      </div>
                      <p className="text-sm font-medium">Message sent!</p>
                      <p className="text-xs text-muted mt-1">Check your messages for a reply.</p>
                    </div>
                  ) : !showMsgBox ? (
                    <button
                      onClick={() => setShowMsgBox(true)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[var(--ink)] text-[var(--bg)] font-semibold py-3 rounded-full hover:opacity-90 transition-opacity text-sm"
                    >
                      <MessageCircle className="w-4 h-4" /> Message about this place
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={msgBody}
                        onChange={e => setMsgBody(e.target.value)}
                        rows={4}
                        autoFocus
                        placeholder="Hi! I'm interested in this sublease. Is it still available?"
                        className="w-full px-3 py-2.5 rounded-xl border hairline text-sm surface-paper focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all resize-none"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={msgLoading || !msgBody.trim()}
                        className="w-full inline-flex items-center justify-center gap-2 bg-[var(--ink)] text-[var(--bg)] font-semibold py-3 rounded-full hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
                      >
                        {msgLoading
                          ? <Loader className="w-4 h-4 animate-spin" />
                          : <><MessageCircle className="w-4 h-4" /> Send message</>
                        }
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isOwner && (
                <div className="border-t hairline pt-4 text-center">
                  <p className="text-xs text-muted">This is your listing.</p>
                </div>
              )}

              {!isOwner && isAuthed && (listing.profile?.email || listing.profile?.phone) && (
                <div className="border-t hairline pt-4 space-y-2">
                  <p className="font-mono uppercase text-[9.5px] tracking-[0.14em]" style={{ color: 'var(--muted)' }}>Also reach out via</p>
                  {listing.profile?.email && (
                    <a
                      href={`mailto:${listing.profile.email}`}
                      className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors"
                    >
                      <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                      {listing.profile.email}
                    </a>
                  )}
                  {listing.profile?.phone && (
                    <a
                      href={`tel:${listing.profile.phone}`}
                      className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors"
                    >
                      <Phone className="w-4 h-4 text-accent flex-shrink-0" />
                      {listing.profile.phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
