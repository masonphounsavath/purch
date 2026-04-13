import { useState } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import type { Listing } from '../../types'

const CHAPEL_HILL = { longitude: -79.0558, latitude: 35.9132 }
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface Props {
  listings: Listing[]
  hoveredId?: string | null
}

export function BrowseMap({ listings, hoveredId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const mappable = listings.filter(l => l.lat != null && l.lng != null)
  const selected  = mappable.find(l => l.id === selectedId) ?? null

  return (
    <Map
      mapboxAccessToken={TOKEN}
      initialViewState={{
        longitude: CHAPEL_HILL.longitude,
        latitude:  CHAPEL_HILL.latitude,
        zoom: 13,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      onClick={() => setSelectedId(null)}
    >
      <NavigationControl position="top-right" />

      {mappable.map(l => (
        <Marker
          key={l.id}
          longitude={l.lng!}
          latitude={l.lat!}
          anchor="bottom"
          onClick={e => {
            e.originalEvent.stopPropagation()
            setSelectedId(prev => (prev === l.id ? null : l.id))
          }}
        >
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md cursor-pointer transition-all select-none border ${
              l.id === selectedId || l.id === hoveredId
                ? 'bg-unc-navy text-white border-unc-navy scale-110'
                : 'bg-white text-unc-navy border-transparent hover:scale-110 hover:border-unc-navy'
            }`}
          >
            ${l.rent.toLocaleString()}
          </div>
        </Marker>
      ))}

      {selected && (
        <Popup
          longitude={selected.lng!}
          latitude={selected.lat!}
          anchor="top"
          onClose={() => setSelectedId(null)}
          closeButton={false}
          offset={16}
          maxWidth="224px"
        >
          <Link
            to={`/listings/${selected.id}`}
            className="block no-underline"
            style={{ textDecoration: 'none' }}
          >
            <div className="w-56 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                {selected.photos?.[0] ? (
                  <img
                    src={selected.photos[0]}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-bold text-unc-navy truncate leading-snug">
                  {selected.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selected.bedrooms === 0 ? 'Studio' : `${selected.bedrooms} bed`}
                  {' · '}
                  <span className="font-semibold text-unc-blue">
                    ${selected.rent.toLocaleString()}/mo
                  </span>
                </p>
              </div>
            </div>
          </Link>
        </Popup>
      )}
    </Map>
  )
}
