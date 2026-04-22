import { useState } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Listing } from '../../types'

const CHAPEL_HILL = { longitude: -79.0558, latitude: 35.9132 }
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface Props {
  listings: Listing[]
  hoveredId?: string | null
}

interface Cluster {
  key: string
  lat: number
  lng: number
  items: Listing[]
}

function groupByCoordinate(listings: Listing[]): Cluster[] {
  const groups = new Map<string, Listing[]>()
  for (const l of listings) {
    const key = `${l.lat!.toFixed(5)},${l.lng!.toFixed(5)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(l)
  }
  return Array.from(groups.entries()).map(([key, items]) => {
    const [lat, lng] = key.split(',').map(Number)
    return { key, lat, lng, items }
  })
}

// Fan items in a circle around the cluster pin
function fanAngles(count: number): number[] {
  if (count === 1) return [0]
  return Array.from({ length: count }, (_, i) => (360 / count) * i - 90)
}

export function BrowseMap({ listings, hoveredId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null)

  const mappable = listings.filter(l => l.lat != null && l.lng != null)
  const clusters = groupByCoordinate(mappable)
  const selected = mappable.find(l => l.id === selectedId) ?? null

  function handleMapClick() {
    setSelectedId(null)
    setExpandedCluster(null)
  }

  return (
    <Map
      mapboxAccessToken={TOKEN}
      initialViewState={{
        longitude: CHAPEL_HILL.longitude,
        latitude: CHAPEL_HILL.latitude,
        zoom: 13,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      onClick={handleMapClick}
    >
      <NavigationControl position="top-right" />

      {clusters.map(cluster => {
        const isCluster = cluster.items.length > 1
        const isExpanded = expandedCluster === cluster.key
        const angles = fanAngles(cluster.items.length)
        const RADIUS = 68

        return (
          <Marker
            key={cluster.key}
            longitude={cluster.lng}
            latitude={cluster.lat}
            anchor="center"
            onClick={e => e.originalEvent.stopPropagation()}
          >
            <div className="relative flex items-center justify-center">

              {/* Fan items — shown when cluster is expanded */}
              <AnimatePresence>
                {isCluster && isExpanded && cluster.items.map((l, i) => {
                  const angle = angles[i]
                  const rad = (angle * Math.PI) / 180
                  const x = Math.cos(rad) * RADIUS
                  const y = Math.sin(rad) * RADIUS
                  const isSelected = l.id === selectedId

                  return (
                    <motion.div
                      key={l.id}
                      className="absolute"
                      initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                      animate={{ opacity: 1, x, y, scale: 1 }}
                      exit={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 24, delay: i * 0.04 }}
                      style={{ zIndex: isSelected ? 30 : 20 }}
                    >
                      <div
                        onClick={e => {
                          e.stopPropagation()
                          setSelectedId(prev => prev === l.id ? null : l.id)
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md cursor-pointer select-none border whitespace-nowrap transition-transform ${
                          isSelected || l.id === hoveredId
                            ? 'bg-unc-navy text-white border-unc-navy scale-110'
                            : 'bg-white text-unc-navy border-transparent hover:scale-110 hover:border-unc-navy'
                        }`}
                      >
                        ${l.rent.toLocaleString()}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Single pin */}
              {!isCluster && (
                <div
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedId(prev => prev === cluster.items[0].id ? null : cluster.items[0].id)
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md cursor-pointer select-none border transition-all ${
                    cluster.items[0].id === selectedId || cluster.items[0].id === hoveredId
                      ? 'bg-unc-navy text-white border-unc-navy scale-110'
                      : 'bg-white text-unc-navy border-transparent hover:scale-110 hover:border-unc-navy'
                  }`}
                >
                  ${cluster.items[0].rent.toLocaleString()}
                </div>
              )}

              {/* Cluster pin */}
              {isCluster && (
                <motion.div
                  onClick={e => {
                    e.stopPropagation()
                    setExpandedCluster(prev => prev === cluster.key ? null : cluster.key)
                    setSelectedId(null)
                  }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  className="cursor-pointer select-none relative z-10"
                >
                  <div
                    className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border transition-colors ${
                      isExpanded
                        ? 'bg-unc-navy text-white border-unc-navy'
                        : 'bg-white text-unc-navy border-unc-navy/20 hover:border-unc-navy'
                    }`}
                    style={{ fontSize: 11 }}
                  >
                    {isExpanded ? '✕' : `${cluster.items.length} listings`}
                  </div>
                  {/* Stacked shadow layers to hint multiple items */}
                  {!isExpanded && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-white border border-unc-navy/10 shadow-sm -z-10 translate-x-0.5 translate-y-0.5" />
                      <div className="absolute inset-0 rounded-full bg-white border border-unc-navy/5 shadow-sm -z-20 translate-x-1 translate-y-1" />
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </Marker>
        )
      })}

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
