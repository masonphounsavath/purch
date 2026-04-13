export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  if (!token) return null
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json` +
        `?access_token=${token}&limit=1&country=us`
    )
    const data = await res.json()
    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].center
      return { lat, lng }
    }
  } catch {}
  return null
}
