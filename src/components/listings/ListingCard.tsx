import { Link } from 'react-router-dom'
import { MapPin, Bed, Bath, Calendar } from 'lucide-react'
import type { Listing } from '../../types'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ListingCard({ listing }: { listing: Listing }) {
  const hasPhoto = listing.photos && listing.photos.length > 0

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all"
    >
      {/* Photo */}
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-blue-50 overflow-hidden">
        {hasPhoto ? (
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-slate-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-unc-navy text-sm leading-snug line-clamp-2 flex-1">
            {listing.title}
          </h3>
          <span className="text-unc-blue font-bold text-base whitespace-nowrap">
            ${listing.rent.toLocaleString()}
            <span className="text-xs text-slate-400 font-normal">/mo</span>
          </span>
        </div>

        <p className="text-xs text-slate-400 flex items-center gap-1 mb-3 truncate">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          {listing.address}
        </p>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms}BR`}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            {listing.bathrooms}BA
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(listing.available_from)} – {formatDate(listing.available_to)}
          </span>
        </div>

        {listing.amenities?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-3">
            {listing.amenities.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] font-medium bg-gray-100 text-slate-500 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
            {listing.amenities.length > 3 && (
              <span className="text-[10px] text-slate-400">+{listing.amenities.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
