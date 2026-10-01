import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Bed, Bath, Calendar, Heart } from 'lucide-react'
import type { Listing } from '../../types'
import { cn } from '../../lib/utils'

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
      className="group block rounded-2xl overflow-hidden bg-white border border-brand-line text-brand-navy font-figtree hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(5,30,55,0.12)] transition"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-mist">
        {hasPhoto ? (
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-navy">
            <img src="/brand/purch_exact_mark.svg" alt="" className="h-12 w-auto opacity-90" />
          </div>
        )}
        {listing.preferred_gender && (
          <span className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/95 text-brand-navy shadow-[0_2px_8px_rgba(5,30,55,0.12)]">
            {listing.preferred_gender === 'female' ? '♀ Female' : '♂ Male'}
          </span>
        )}
        {onToggleSave && (
          <motion.button
            type="button"
            aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
            aria-pressed={!!isSaved}
            onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleSave(listing.id) }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center bg-white/95 shadow-[0_2px_8px_rgba(5,30,55,0.12)]"
            whileTap={{ scale: 1.4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Heart className={cn('w-4 h-4 transition-colors', isSaved ? 'fill-brand-sky text-brand-sky' : 'fill-none text-brand-muted')} />
          </motion.button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-base font-bold leading-snug line-clamp-2 flex-1">
            {listing.title}
          </h3>
          <span className="font-outfit text-xl font-extrabold tabular-nums whitespace-nowrap">
            ${listing.rent.toLocaleString()}
            <span className="font-figtree text-xs font-medium text-brand-muted">/mo</span>
          </span>
        </div>

        <p className="text-[13px] flex items-center gap-1 mb-3 truncate text-brand-muted">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {listing.address}
        </p>

        <div className="flex items-center gap-3 text-[13px] font-medium">
          <span className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms}BR`}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            {listing.bathrooms}BA
          </span>
          <span className="flex items-center gap-1 ml-auto text-brand-muted">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(listing.available_from)} – {formatDate(listing.available_to)}
          </span>
        </div>

        {listing.amenities?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-3">
            {listing.amenities.slice(0, 3).map(tag => (
              <span key={tag} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-brand-mist text-brand-muted">
                {tag}
              </span>
            ))}
            {listing.amenities.length > 3 && (
              <span className="text-[11px] font-medium px-1 py-1 text-brand-muted">
                +{listing.amenities.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
