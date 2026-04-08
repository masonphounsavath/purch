import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, Calendar, ChevronLeft,
  ChevronRight, MessageCircle, ArrowLeft, Pencil, Loader
} from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
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
      <div className="aspect-[16/9] bg-gradient-to-br from-slate-100 to-blue-50 rounded-2xl flex items-center justify-center">
        <MapPin className="w-10 h-10 text-slate-300" />
      </div>
    )
  }
  return (
    <div className="relative">
      <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100">
        <img src={photos[idx]} alt="" className="w-full h-full object-cover" />
      </div>
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-unc-navy" />
          </button>
          <button
            onClick={() => setIdx(i => (i + 1) % photos.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-unc-navy" />
          </button>
          <div className="flex justify-center gap-1.5 mt-3">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-unc-blue' : 'bg-gray-300'}`}
              />
            ))}
          </div>
          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {photos.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === idx ? 'border-unc-blue' : 'border-transparent'}`}
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
      .select('*, profile:profiles(display_name, avatar_url)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setListing(data as Listing)
        setLoading(false)
      })
  }, [id])

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
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <Loader className="w-6 h-6 text-unc-blue animate-spin" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 pt-40 text-center">
          <p className="text-2xl font-bold text-unc-navy mb-2">Listing not found</p>
          <p className="text-slate-body mb-6">It may have been removed or deactivated.</p>
          <Link to="/browse" className="text-unc-blue font-medium hover:underline">← Back to browse</Link>
        </div>
      </div>
    )
  }

  if (!listing) return null

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-20">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-unc-navy transition-colors mb-6"
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
                <h1 className="text-2xl font-bold text-unc-navy leading-snug">{listing.title}</h1>
                <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {listing.address}
                </p>
              </div>
              {isOwner && (
                <Link
                  to={`/listings/${listing.id}/edit`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-unc-navy border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
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
                <div key={stat.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                  <p className="font-semibold text-unc-navy text-sm">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Availability */}
            <div className="flex items-center gap-3 text-sm text-slate-body">
              <Calendar className="w-4 h-4 text-unc-blue flex-shrink-0" />
              <span>Available <strong className="text-unc-navy">{formatDate(listing.available_from)}</strong> through <strong className="text-unc-navy">{formatDate(listing.available_to)}</strong></span>
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">About this place</h2>
                <p className="text-slate-body leading-relaxed text-sm whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            {/* Amenities */}
            {listing.amenities?.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1.5 text-sm font-medium bg-gray-50 border border-gray-100 text-slate-600 px-3 py-1.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: sticky contact card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
              <div>
                <span className="text-3xl font-bold text-unc-navy">${listing.rent.toLocaleString()}</span>
                <span className="text-slate-400 text-sm">/month</span>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-slate-400 mb-1">Posted by</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-unc-blue/20 flex items-center justify-center text-xs font-bold text-unc-blue">
                    {(listing.profile?.display_name ?? 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-unc-navy">
                    {listing.profile?.display_name ?? 'UNC Student'}
                  </span>
                </div>
              </div>

              {!isOwner && (
                <div className="border-t border-gray-100 pt-4">
                  {!isAuthed ? (
                    <p className="text-sm text-slate-400 text-center">
                      <Link to="/" className="text-unc-blue font-medium hover:underline">Sign in</Link> to message this student.
                    </p>
                  ) : msgSent ? (
                    <div className="text-center py-2">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <MessageCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <p className="text-sm font-medium text-unc-navy">Message sent!</p>
                      <p className="text-xs text-slate-400 mt-1">Check your messages for a reply.</p>
                    </div>
                  ) : !showMsgBox ? (
                    <button
                      onClick={() => setShowMsgBox(true)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-unc-navy text-white font-semibold py-3 rounded-xl hover:bg-[#1c3a6b] transition-colors text-sm"
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
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-unc-navy placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all resize-none"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={msgLoading || !msgBody.trim()}
                        className="w-full inline-flex items-center justify-center gap-2 bg-unc-navy text-white font-semibold py-3 rounded-xl hover:bg-[#1c3a6b] transition-colors text-sm disabled:opacity-50"
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
                <div className="border-t border-gray-100 pt-4 text-center">
                  <p className="text-xs text-slate-400">This is your listing.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
