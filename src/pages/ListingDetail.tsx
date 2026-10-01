import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import {
  MapPin, Calendar, ChevronLeft,
  ChevronRight, MessageCircle, ArrowLeft, Pencil, Loader, Mail, Phone
} from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { SignInModal } from '../components/auth/SignInModal'
import { DetailMap } from '../components/map/DetailMap'
import { Eyebrow } from '../components/ui/Eyebrow'
import { button, container, field } from '../components/ui/styles'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import type { Listing } from '../types'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

const galleryArrow = 'absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-navy shadow-[0_4px_14px_rgba(5,30,55,0.2)] hover:bg-brand-mist transition-colors'

function PhotoGallery({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0)
  if (photos.length === 0) {
    return (
      <div className="aspect-[16/9] rounded-[18px] bg-brand-navy flex items-center justify-center">
        <img src="/brand/purch_exact_mark.svg" alt="" className="h-20 w-auto opacity-90" />
      </div>
    )
  }
  return (
    <div className="relative">
      <div className="relative aspect-[16/9] rounded-[18px] overflow-hidden bg-brand-mist">
        <img src={photos[idx]} alt="" className="w-full h-full object-cover" />
        {photos.length > 1 && (
          <>
            <button onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)} aria-label="Previous photo" className={cn(galleryArrow, 'left-3')}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setIdx(i => (i + 1) % photos.length)} aria-label="Next photo" className={cn(galleryArrow, 'right-3')}>
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-brand-navy/80 text-white text-xs font-semibold tabular-nums">
              {idx + 1} / {photos.length}
            </span>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Photo ${i + 1}`}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-[10px] overflow-hidden border-2 transition',
                i === idx ? 'border-brand-sky' : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
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

  const [showSignIn, setShowSignIn] = useState(false)

  if (loading) {
    return (
      <PageShell footer={false}>
        <div className="flex items-center justify-center pt-40">
          <Loader className="w-6 h-6 text-brand-sky animate-spin" />
        </div>
      </PageShell>
    )
  }

  if (notFound) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-6 py-32 text-center flex flex-col items-center gap-3">
          <Eyebrow>404</Eyebrow>
          <p className="font-outfit text-4xl font-extrabold tracking-[-0.03em]">Listing not found</p>
          <p className="text-brand-muted mb-4">It may have been removed or deactivated.</p>
          <Link to="/browse" className={button('primary', 'sm')}>
            <ArrowLeft className="w-4 h-4" /> Back to browse
          </Link>
        </div>
      </PageShell>
    )
  }

  if (!listing) return null

  const sectionLabel = 'block mb-4'

  return (
    <PageShell>
      <AnimatePresence>
        {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      </AnimatePresence>

      <div className={cn(container, 'pt-8 lg:pt-10 pb-20')}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-brand-muted hover:text-brand-navy transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

          {/* Left: photos + details */}
          <div className="lg:col-span-2 space-y-10">
            <PhotoGallery photos={listing.photos ?? []} />

            {/* Title row */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-outfit text-[34px] sm:text-[44px] leading-[1.02] font-extrabold tracking-[-0.03em]">
                  {listing.title}
                </h1>
                <p className="flex items-center gap-1.5 mt-3 text-[15px] text-brand-muted">
                  <MapPin className="w-4 h-4 flex-shrink-0" /> {listing.address}
                </p>
              </div>
              {isOwner && (
                <Link to={`/listings/${listing.id}/edit`} className={button('outline', 'sm', 'flex-shrink-0')}>
                  <Pencil className="w-4 h-4" /> Edit
                </Link>
              )}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Bedrooms', value: listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed` },
                { label: 'Bathrooms', value: `${listing.bathrooms} bath` },
                { label: 'Furnished', value: listing.is_furnished ? 'Yes' : 'No' },
                { label: 'Monthly rent', value: `$${listing.rent.toLocaleString()}` },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl bg-brand-mist p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted mb-1.5">{stat.label}</p>
                  <p className="font-outfit text-xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Availability */}
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-brand-line">
              <span className="w-10 h-10 rounded-[10px] bg-brand-navy text-brand-sky flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </span>
              <span className="text-[15px] text-brand-muted">Available <strong className="font-semibold text-brand-navy">{formatDate(listing.available_from)}</strong> through <strong className="font-semibold text-brand-navy">{formatDate(listing.available_to)}</strong></span>
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <Eyebrow className={sectionLabel}>ABOUT THIS PLACE</Eyebrow>
                <p className="leading-relaxed text-base lg:text-[17px] whitespace-pre-line text-brand-muted">{listing.description}</p>
              </div>
            )}

            {/* Amenities */}
            {listing.amenities?.length > 0 && (
              <div>
                <Eyebrow className={sectionLabel}>AMENITIES</Eyebrow>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map(tag => (
                    <span key={tag} className="inline-flex items-center text-sm font-semibold px-3.5 py-2 rounded-full bg-brand-mist text-brand-navy">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location map */}
            {listing.lat != null && listing.lng != null && (
              <div>
                <Eyebrow className={sectionLabel}>LOCATION</Eyebrow>
                <DetailMap lat={listing.lat} lng={listing.lng} />
                <p className="text-[13px] text-brand-muted mt-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {listing.address}
                </p>
              </div>
            )}
          </div>

          {/* Right: sticky contact card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-[20px] border border-brand-line bg-white shadow-[0_10px_30px_rgba(5,30,55,0.08)] p-6 space-y-5">
              <div>
                <span className="font-outfit text-[40px] leading-none font-extrabold tracking-[-0.03em]">${listing.rent.toLocaleString()}</span>
                <span className="text-brand-muted text-[15px] font-medium">/month</span>
              </div>

              <div className="border-t border-brand-line pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted mb-2">Posted by</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-brand-navy flex items-center justify-center text-sm font-bold text-brand-sky">
                    {(listing.profile?.display_name ?? 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-[15px] font-semibold">
                    {listing.profile?.display_name ?? 'UNC Student'}
                  </span>
                </div>
              </div>

              {!isOwner && (
                <div className="border-t border-brand-line pt-4">
                  {!isAuthed ? (
                    <div className="flex flex-col gap-3 text-center">
                      <button type="button" onClick={() => setShowSignIn(true)} className={button('primary', 'lg', 'w-full')}>
                        <MessageCircle className="w-4 h-4" /> Sign in to message
                      </button>
                      <p className="text-[13px] text-brand-muted">Only verified @unc.edu students can message hosts.</p>
                    </div>
                  ) : msgSent ? (
                    <div className="text-center py-2">
                      <div className="w-11 h-11 bg-brand-sky/15 rounded-full flex items-center justify-center mx-auto mb-2">
                        <MessageCircle className="w-5 h-5 text-brand-sky-ink" />
                      </div>
                      <p className="font-semibold">Message sent!</p>
                      <p className="text-[13px] text-brand-muted mt-1">Check your <Link to="/messages" className="font-semibold text-brand-navy underline underline-offset-4">messages</Link> for a reply.</p>
                    </div>
                  ) : !showMsgBox ? (
                    <button onClick={() => setShowMsgBox(true)} className={button('primary', 'lg', 'w-full')}>
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
                        className={cn(field, 'resize-none')}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={msgLoading || !msgBody.trim()}
                        className={button('primary', 'lg', 'w-full')}
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
                <div className="border-t border-brand-line pt-4 text-center">
                  <p className="text-[13px] text-brand-muted">This is your listing.</p>
                </div>
              )}

              {!isOwner && isAuthed && (listing.profile?.email || listing.profile?.phone) && (
                <div className="border-t border-brand-line pt-4 space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted">Also reach out via</p>
                  {listing.profile?.email && (
                    <a
                      href={`mailto:${listing.profile.email}`}
                      className="flex items-center gap-2 text-sm font-medium text-brand-muted hover:text-brand-navy transition-colors break-all"
                    >
                      <Mail className="w-4 h-4 text-brand-sky-ink flex-shrink-0" />
                      {listing.profile.email}
                    </a>
                  )}
                  {listing.profile?.phone && (
                    <a
                      href={`tel:${listing.profile.phone}`}
                      className="flex items-center gap-2 text-sm font-medium text-brand-muted hover:text-brand-navy transition-colors"
                    >
                      <Phone className="w-4 h-4 text-brand-sky-ink flex-shrink-0" />
                      {listing.profile.phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
