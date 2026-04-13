import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X, Plus } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { ListingCard } from '../components/listings/ListingCard'
import { useListings, type Filters } from '../hooks/useListings'
import { useAuth } from '../hooks/useAuth'
import { useSavedListings } from '../hooks/useSavedListings'

function FilterSidebar({
  filters,
  onChange,
  onReset,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  onReset: () => void
}) {
  const hasFilters = Object.values(filters).some(v => v !== undefined && v !== -1)

  return (
    <aside className="w-full md:w-64 md:flex-shrink-0">
      <div className="sticky top-24">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-unc-navy flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </h2>
          {hasFilters && (
            <button onClick={onReset} className="text-xs text-slate-400 hover:text-unc-navy transition-colors flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Price */}
          <div>
            <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">Price / month</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minRent ?? ''}
                onChange={e => onChange({ ...filters, minRent: e.target.value ? +e.target.value : undefined })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-unc-navy focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all"
              />
              <span className="text-slate-300 text-sm">–</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxRent ?? ''}
                onChange={e => onChange({ ...filters, maxRent: e.target.value ? +e.target.value : undefined })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-unc-navy focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all"
              />
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">Bedrooms</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Any', value: -1 },
                { label: 'Studio', value: 0 },
                { label: '1', value: 1 },
                { label: '2', value: 2 },
                { label: '3+', value: 3 },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onChange({ ...filters, bedrooms: opt.value })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    (filters.bedrooms ?? -1) === opt.value
                      ? 'bg-unc-navy text-white border-unc-navy'
                      : 'bg-white text-slate-600 border-gray-200 hover:border-unc-navy'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Furnished */}
          <div>
            <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">Furnished</label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.furnished ?? false}
                onChange={e => onChange({ ...filters, furnished: e.target.checked || undefined })}
                className="w-4 h-4 accent-unc-blue"
              />
              <span className="text-sm text-slate-600">Furnished only</span>
            </label>
          </div>

          {/* Available from */}
          <div>
            <label className="block text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">Available by</label>
            <input
              type="date"
              value={filters.availableFrom ?? ''}
              onChange={e => onChange({ ...filters, availableFrom: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-unc-navy focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all"
            />
          </div>
        </div>
      </div>
    </aside>
  )
}

const EMPTY_FILTERS: Filters = { bedrooms: -1 }

export default function Browse() {
  const { isAuthed } = useAuth()
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const { listings, loading } = useListings(filters)
  const { savedIds, toggleSave } = useSavedListings()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-20">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-unc-navy">Subleases in Chapel Hill</h1>
            <p className="text-slate-body mt-1 text-sm">
              {loading ? 'Loading...' : `${listings.length} listing${listings.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
          {isAuthed && (
            <Link
              to="/post"
              className="inline-flex items-center gap-1.5 bg-unc-navy text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1c3a6b] transition-colors"
            >
              <Plus className="w-4 h-4" /> Post a listing
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:gap-10">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(EMPTY_FILTERS)}
          />

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-gray-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-slate-400 text-lg font-medium mb-2">No listings found</p>
                <p className="text-slate-300 text-sm mb-6">Try adjusting your filters</p>
                {isAuthed && (
                  <Link to="/post" className="text-unc-blue text-sm font-medium hover:underline">
                    Be the first to post →
                  </Link>
                )}
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
              >
                {listings.map(l => (
                  <motion.div
                    key={l.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } }}
                  >
                    <ListingCard
                      listing={l}
                      isSaved={savedIds.has(l.id)}
                      onToggleSave={isAuthed ? toggleSave : undefined}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
