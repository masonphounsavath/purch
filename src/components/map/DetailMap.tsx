import Map, { Marker } from 'react-map-gl/mapbox'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface Props {
  lat: number
  lng: number
}

export function DetailMap({ lat, lng }: Props) {
  return (
    <div className="w-full h-52 rounded-2xl overflow-hidden border border-gray-100">
      <Map
        mapboxAccessToken={TOKEN}
        initialViewState={{ longitude: lng, latitude: lat, zoom: 15 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        interactive={false}
      >
        <Marker longitude={lng} latitude={lat} anchor="bottom">
          <div className="w-8 h-8 rounded-full bg-unc-navy border-2 border-white shadow-lg flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-white" />
          </div>
        </Marker>
      </Map>
    </div>
  )
}
