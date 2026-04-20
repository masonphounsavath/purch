import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Bed, Bath, Calendar, Heart } from 'lucide-react'
import type { Listing } from '../../types'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ListingCard({
  listing,
  isSaved,
  onToggleSave,
}: {
  listing: Listing
  isSaved?: boolean
  onToggleSave?: (listingId: string) => void
}) {
  const hasPhoto = listing.photos && listing.photos.length > 0

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group block rounded-2xl overflow-hidden eased"
      style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'var(--bg-2)' }}>
        {hasPhoto ? (
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-8 h-8" style={{ color: 'var(--line)' }} />
          </div>
        )}
        {onToggleSave && (
          <motion.button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleSave(listing.id) }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center eased backdrop-blur-sm"
            style={{ background: 'color-mix(in oklab, var(--paper) 88%, transparent)', border: '1px solid var(--line)' }}
            whileTap={{ scale: 1.4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Heart
              className="w-4 h-4 transition-colors"
              style={{ fill: isSaved ? 'var(--accent)' : 'none', color: isSaved ? 'var(--accent)' : 'var(--muted)' }}
            />
          </motion.button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display text-[15px] leading-snug line-clamp-2 flex-1" style={{ fontWeight: 500, letterSpacing: '-0.005em', color: 'var(--ink)' }}>
            {listing.title}
          </h3>
          <span className="font-display tabnum font-medium whitespace-nowrap" style={{ fontSize: 18, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
            ${listing.rent.toLocaleString()}
            <span className="font-mono text-[11px]" style={{ color: 'var(--muted)', fontWeight: 400 }}>/mo</span>
          </span>
        </div>

        <p className="text-xs flex items-center gap-1 mb-3 truncate" style={{ color: 'var(--muted)' }}>
          <MapPin className="w-3 h-3 flex-shrink-0" />
          {listing.address}
        </p>

        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--ink-2)' }}>
          <span className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms}BR`}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            {listing.bathrooms}BA
          </span>
          <span className="flex items-center gap-1 ml-auto" style={{ color: 'var(--muted)' }}>
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(listing.available_from)} – {formatDate(listing.available_to)}
          </span>
        </div>

        {listing.amenities?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-3">
            {listing.amenities.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-2)', color: 'var(--muted)' }}
              >
                {tag}
              </span>
            ))}
            {listing.amenities.length > 3 && (
              <span className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
                +{listing.amenities.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
