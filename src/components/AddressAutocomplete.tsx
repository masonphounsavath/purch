import { useState, useEffect, useRef } from 'react'

interface Suggestion {
  place_name: string
  center: [number, number]
}

interface Props {
  value: string
  onChange: (address: string) => void
  onCoords: (coords: { lat: number; lng: number } | null) => void
  error?: string
}

export function AddressAutocomplete({ value, onChange, onCoords, error }: Props) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
            `?access_token=${token}&limit=5&country=us&types=address,place`
        )
        const data = await res.json()
        setSuggestions(data.features ?? [])
        setOpen(true)
      } catch {}
    }, 300)
    return () => clearTimeout(timeoutRef.current)
  }, [query, token])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(s: Suggestion) {
    setQuery(s.place_name)
    onChange(s.place_name)
    onCoords({ lat: s.center[1], lng: s.center[0] })
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        value={query}
        onChange={e => {
          setQuery(e.target.value)
          onChange(e.target.value)
          onCoords(null)
        }}
        placeholder="123 Franklin St, Chapel Hill, NC 27514"
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-unc-navy placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => select(s)}
              className="px-4 py-3 text-sm text-unc-navy cursor-pointer hover:bg-slate-50 transition-colors border-b border-gray-100 last:border-0"
            >
              {s.place_name}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
