import { useState } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox'
import { Link } from 'react-router-dom'
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
  const groups: Record<string, Listing[]> = {}
  for (const l of listings) {
    const key = `${l.lat!.toFixed(5)},${l.lng!.toFixed(5)}`
    if (!groups[key]) groups[key] = []
    groups[key].push(l)
  }
  return Object.entries(groups).map(([key, items]) => {
    const [lat, lng] = key.split(',').map(Number)
    return { key, lat, lng, items }
  })
}

// Clusters bigger than this get a scrollable list instead of a radial fan —
// a fixed-radius circle can't fit 5+ variable-width price pills without overlap
const MAX_FAN_ITEMS = 4
// Header + max-h-56 list + gap — used to decide whether the list fits above the pin
const LIST_HEIGHT = 280

// Keep wheel/drag inside the list from zooming or panning the map. Mapbox listens
// natively on the canvas container, so React's synthetic stopPropagation is too late.
function isolateFromMap(el: HTMLDivElement | null) {
  if (!el) return
  const stop = (e: Event) => e.stopPropagation()
  for (const type of ['wheel', 'mousedown', 'touchstart', 'pointerdown', 'dblclick']) {
    el.addEventListener(type, stop)
  }
}

// Fan items in a circle around the cluster pin
function fanAngles(count: number): number[] {
  if (count === 1) return [0]
  return Array.from({ length: count }, (_, i) => (360 / count) * i - 90)
}

export function BrowseMap({ listings, hoveredId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null)
  const [listBelow, setListBelow] = useState(false)
  const [roomOnRight, setRoomOnRight] = useState(true)

  const mappable = listings.filter(l => l.lat != null && l.lng != null)
  const clusters = groupByCoordinate(mappable)
  const selected = mappable.find(l => l.id === selectedId) ?? null
  // A list below its pin means there's no room up top either — put the listing popup beside it
  const selectedInListBelow = listBelow && clusters.some(c =>
    c.key === expandedCluster && c.items.length > MAX_FAN_ITEMS && c.items.some(l => l.id === selectedId))

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
        const useList = cluster.items.length > MAX_FAN_ITEMS
        const angles = fanAngles(cluster.items.length)
        const RADIUS = 68

        return (
          <Marker
            key={cluster.key}
            longitude={cluster.lng}
            latitude={cluster.lat}
            anchor="center"
            // Lift the open cluster above neighbouring markers so its fan/list isn't covered
            style={isExpanded ? { zIndex: 10 } : undefined}
            onClick={e => e.originalEvent.stopPropagation()}
          >
            <div className="relative flex items-center justify-center">

              {/* Fan items — shown when cluster is expanded */}
              <AnimatePresence>
                {isCluster && isExpanded && !useList && cluster.items.map((l, i) => {
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
                        className={`px-2.5 py-1.5 rounded-md text-[13px] font-figtree font-bold shadow-[0_2px_8px_rgba(5,30,55,0.18)] cursor-pointer select-none border whitespace-nowrap transition-transform ${
                          isSelected || l.id === hoveredId
                            ? 'bg-brand-navy text-white border-brand-navy scale-110'
                            : 'bg-white text-brand-navy border-transparent hover:scale-110 hover:border-brand-sky'
                        }`}
                      >
                        ${l.rent.toLocaleString()}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* List popup — for clusters too big to fan. Opens above the pin (clear of the
                  selected-listing Popup, which hangs below) unless there's no room up top. */}
              <AnimatePresence>
                {isCluster && isExpanded && useList && (
                  <motion.div
                    key="list"
                    ref={isolateFromMap}
                    onClick={e => e.stopPropagation()}
                    initial={{ opacity: 0, y: listBelow ? -6 : 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: listBelow ? -6 : 6, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                    className={`absolute ${listBelow ? 'top-full mt-2.5 origin-top' : 'bottom-full mb-2.5 origin-bottom'} left-1/2 -ml-[88px] w-44 z-20 rounded-xl bg-white shadow-[0_8px_24px_rgba(5,30,55,0.22)] font-figtree overflow-hidden`}
                  >
                    <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">
                      {cluster.items.length} at this address
                    </p>
                    <ul className="max-h-56 overflow-y-auto overscroll-contain px-1.5 pb-1.5 space-y-0.5">
                      {cluster.items.map(l => {
                        const isSelected = l.id === selectedId
                        return (
                          <li key={l.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedId(prev => prev === l.id ? null : l.id)}
                              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-left border transition-colors ${
                                isSelected || l.id === hoveredId
                                  ? 'bg-brand-navy text-white border-brand-navy'
                                  : 'bg-white text-brand-navy border-transparent hover:border-brand-sky'
                              }`}
                            >
                              <span className="text-[13px] font-bold">${l.rent.toLocaleString()}</span>
                              <span className={`text-[11px] font-semibold ${isSelected || l.id === hoveredId ? 'text-white/70' : 'text-brand-muted'}`}>
                                {l.bedrooms === 0 ? 'Studio' : `${l.bedrooms} bed`}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Single pin */}
              {!isCluster && (
                <div
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedId(prev => prev === cluster.items[0].id ? null : cluster.items[0].id)
                  }}
                  className={`px-2.5 py-1.5 rounded-md text-[13px] font-figtree font-bold shadow-[0_2px_8px_rgba(5,30,55,0.18)] cursor-pointer select-none border transition-all ${
                    cluster.items[0].id === selectedId || cluster.items[0].id === hoveredId
                      ? 'bg-brand-navy text-white border-brand-navy scale-110'
                      : 'bg-white text-brand-navy border-transparent hover:scale-110 hover:border-brand-sky'
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
                    const pin = e.currentTarget.getBoundingClientRect()
                    const mapRect = e.currentTarget.closest('.mapboxgl-map')?.getBoundingClientRect()
                    setListBelow(pin.top - (mapRect?.top ?? 0) < LIST_HEIGHT)
                    setRoomOnRight(!mapRect || pin.left + pin.width / 2 < mapRect.left + mapRect.width / 2)
                    setExpandedCluster(prev => prev === cluster.key ? null : cluster.key)
                    setSelectedId(null)
                  }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  className="cursor-pointer select-none relative z-10"
                >
                  <div
                    className={`px-3 py-1.5 rounded-full text-xs font-figtree font-bold shadow-lg border transition-colors ${
                      isExpanded
                        ? 'bg-brand-navy text-white border-brand-navy'
                        : 'bg-brand-sky text-brand-navy border-brand-sky hover:brightness-105'
                    }`}
                    style={{ fontSize: 11 }}
                  >
                    {isExpanded ? '✕' : `${cluster.items.length} listings`}
                  </div>
                  {/* Stacked shadow layers to hint multiple items */}
                  {!isExpanded && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-brand-sky/60 border border-brand-navy/10 shadow-sm -z-10 translate-x-0.5 translate-y-0.5" />
                      <div className="absolute inset-0 rounded-full bg-brand-sky/30 border border-brand-navy/5 shadow-sm -z-20 translate-x-1 translate-y-1" />
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
          anchor={selectedInListBelow ? (roomOnRight ? 'left' : 'right') : 'top'}
          onClose={() => setSelectedId(null)}
          closeButton={false}
          // Beside a list, clear its half-width (w-44 / 2) plus a gap
          offset={selectedInListBelow ? 100 : 16}
          maxWidth="224px"
        >
          <Link
            to={`/listings/${selected.id}`}
            className="block no-underline"
            style={{ textDecoration: 'none' }}
          >
            <div className="w-56 rounded-xl overflow-hidden bg-white font-figtree">
              <div className="aspect-[4/3] bg-brand-navy overflow-hidden">
                {selected.photos?.[0] ? (
                  <img
                    src={selected.photos[0]}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <img src="/brand/purch_exact_mark.svg" alt="" className="h-10 w-auto" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-brand-navy truncate leading-snug">
                  {selected.title}
                </p>
                <p className="text-xs text-brand-muted mt-0.5">
                  {selected.bedrooms === 0 ? 'Studio' : `${selected.bedrooms} bed`}
                  {' · '}
                  <span className="font-outfit font-extrabold text-brand-navy">
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
