import { useState, useRef, useEffect } from 'react'
import { MapPin } from 'lucide-react'

interface Suggestion {
  place_name: string
  center: [number, number]
}

interface Props {
  value: string
  onChange: (address: string) => void
  onCoordsChange?: (lat: number, lng: number) => void
  error?: string
  placeholder?: string
}

export function AddressAutocomplete({ value, onChange, onCoordsChange, error, placeholder }: Props) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    onChange(val)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 3) { setSuggestions([]); setOpen(false); return }

    debounceRef.current = setTimeout(async () => {
      const token = import.meta.env.VITE_MAPBOX_TOKEN
      if (!token) return
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json` +
          `?access_token=${token}&limit=5&country=us&types=address,place`
        )
        const data = await res.json()
        setSuggestions(data.features ?? [])
        setOpen(true)
      } catch {}
    }, 300)
  }

  function select(suggestion: Suggestion) {
    setQuery(suggestion.place_name)
    onChange(suggestion.place_name)
    if (onCoordsChange) {
      onCoordsChange(suggestion.center[1], suggestion.center[0])
    }
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder ?? '123 Franklin St, Chapel Hill, NC 27514'}
          className={`w-full pl-10 pr-4 py-3 rounded-[10px] border bg-white text-[15px] text-brand-navy placeholder:text-brand-muted/70 outline-none focus:ring-2 focus:ring-brand-sky/25 focus:border-brand-sky transition ${
            error ? 'border-red-300' : 'border-brand-line'
          }`}
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1.5 w-full bg-white border border-brand-line rounded-[12px] shadow-[0_12px_32px_rgba(5,30,55,0.14)] overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => select(s)}
              className="px-4 py-3 text-sm text-brand-navy hover:bg-brand-mist cursor-pointer border-b border-brand-line last:border-0"
            >
              {s.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
