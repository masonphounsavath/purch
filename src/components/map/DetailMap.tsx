import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
import { Footprints } from 'lucide-react'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// Significant UNC-area landmarks
const LANDMARKS = [
  { name: 'Franklin St',         lat: 35.9132, lng: -79.0558 },
  { name: 'Lenoir Hall',         lat: 35.9066, lng: -79.0503 },
  { name: 'Davis Library',       lat: 35.9101, lng: -79.0477 },
  { name: 'Kenan Stadium',       lat: 35.9044, lng: -79.0468 },
  { name: 'UNC Health',          lat: 35.9045, lng: -79.0526 },
  { name: 'Rams Head Rec',       lat: 35.9017, lng: -79.0473 },
  { name: 'Carolina Inn',        lat: 35.9115, lng: -79.0521 },
  { name: 'Polk Pl (The Pit)',   lat: 35.9077, lng: -79.0497 },
]

// Haversine distance in meters
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Walking speed ~80 m/min
function walkMinutes(meters: number) {
  return Math.max(1, Math.round(meters / 80))
}

interface Props {
  lat: number
  lng: number
}

export function DetailMap({ lat, lng }: Props) {
  // Compute closest 3 landmarks
  const nearby = LANDMARKS
    .map(lm => ({ ...lm, meters: haversineMeters(lat, lng, lm.lat, lm.lng) }))
    .sort((a, b) => a.meters - b.meters)
    .slice(0, 3)

  return (
    <div>
      <div className="w-full h-[260px] rounded-[18px] overflow-hidden border border-brand-line">
        <Map
          mapboxAccessToken={TOKEN}
          initialViewState={{ longitude: lng, latitude: lat, zoom: 15 }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          interactive={true}
        >
          <NavigationControl position="top-right" showCompass={false} />

          {/* Listing marker */}
          <Marker longitude={lng} latitude={lat} anchor="bottom">
            <div className="w-8 h-8 rounded-full bg-brand-navy border-[3px] border-white shadow-lg flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-sky" />
            </div>
          </Marker>

          {/* Landmark markers (top 3) */}
          {nearby.map(lm => (
            <Marker key={lm.name} longitude={lm.lng} latitude={lm.lat} anchor="bottom">
              <div
                title={lm.name}
                className="px-2 py-1 rounded-md bg-white text-[11px] font-figtree font-bold text-brand-navy shadow-[0_2px_8px_rgba(5,30,55,0.18)] whitespace-nowrap"
              >
                {lm.name}
              </div>
            </Marker>
          ))}
        </Map>
      </div>

      {/* Walking distance badges */}
      <div className="flex flex-wrap gap-2 mt-3">
        {nearby.map(lm => (
          <span
            key={lm.name}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-full bg-brand-mist text-brand-navy"
          >
            <Footprints className="w-3.5 h-3.5 text-brand-sky-ink" />
            <span className="font-outfit font-extrabold">{walkMinutes(lm.meters)} min</span> · {lm.name}
          </span>
        ))}
      </div>
    </div>
  )
}
