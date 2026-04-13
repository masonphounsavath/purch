import Map, { Marker } from 'react-map-gl/mapbox'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const MOCK_PINS = [
  { id: '1', lat: 35.9131, lng: -79.0543, price: '$850' },
  { id: '2', lat: 35.9065, lng: -79.0527, price: '$1,100' },
  { id: '3', lat: 35.9096, lng: -79.0758, price: '$720' },
  { id: '4', lat: 35.9182, lng: -79.0612, price: '$950' },
]

export function LandingMap() {
  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-sm border border-gray-100">
      <Map
        mapboxAccessToken={TOKEN}
        initialViewState={{ longitude: -79.063, latitude: 35.9115, zoom: 12.6 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        interactive={false}
        attributionControl={false}
      >
        {MOCK_PINS.map(pin => (
          <Marker key={pin.id} longitude={pin.lng} latitude={pin.lat} anchor="bottom">
            <div className="px-2.5 py-1 rounded-full text-xs font-bold shadow-md bg-white text-unc-navy border border-gray-200 select-none">
              {pin.price}
            </div>
          </Marker>
        ))}
      </Map>

      {/* subtle vignette to blend edges */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_40px_8px_rgba(255,255,255,0.6)]" />

      {/* CTA overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 bg-unc-navy text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live map on Browse
        </div>
      </div>
    </div>
  )
}
