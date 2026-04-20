import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X, Plus, Map as MapIcon, List } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { ListingCard } from '../components/listings/ListingCard'
import { BrowseMap } from '../components/map/BrowseMap'
import { useListings, type Filters, type SortOption } from '../hooks/useListings'
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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-unc-navy flex items-center gap-2 text-sm">
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </h2>
        {hasFilters && (
          <button
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-unc-navy transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-4">
        {/* Price */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase whitespace-nowrap">
            Price
          </span>
          <input
            type="number"
            placeholder="Min"
            value={filters.minRent ?? ''}
            onChange={e =>
              onChange({ ...filters, minRent: e.target.value ? +e.target.value : undefined })
            }
            className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-unc-navy focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all"
          />
          <span className="text-slate-300 text-xs">–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxRent ?? ''}
            onChange={e =>
              onChange({ ...filters, maxRent: e.target.value ? +e.target.value : undefined })
            }
            className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-unc-navy focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all"
          />
        </div>

        {/* Bedrooms */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase whitespace-nowrap">
            Beds
          </span>
          <div className="flex gap-1">
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
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
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
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.furnished ?? false}
              onChange={e => onChange({ ...filters, furnished: e.target.checked || undefined })}
              className="w-3.5 h-3.5 accent-unc-blue"
            />
            <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              Furnished
            </span>
          </label>
        </div>

        {/* Available by */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase whitespace-nowrap">
            Available by
          </span>
          <input
            type="date"
            value={filters.availableFrom ?? ''}
            onChange={e =>
              onChange({ ...filters, availableFrom: e.target.value || undefined })
            }
            className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-unc-navy focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase whitespace-nowrap">
            Sort
          </span>
          <select
            value={filters.sort ?? 'newest'}
            onChange={e => onChange({ ...filters, sort: e.target.value as SortOption })}
            className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-unc-navy focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all bg-white"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>
      </div>
    </div>
  )
}

const EMPTY_FILTERS: Filters = { bedrooms: -1 }

function hasActiveFilters(f: Filters) {
  return f.minRent !== undefined || f.maxRent !== undefined ||
    (f.bedrooms !== undefined && f.bedrooms !== -1) ||
    f.furnished || f.availableFrom !== undefined
}

export default function Browse() {
  const { isAuthed } = useAuth()
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const { listings, loading } = useListings(filters)
  const { savedIds, toggleSave } = useSavedListings()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')

  return (
    <div className="h-screen flex flex-col bg-white">
      <Navbar />

      {/* Split layout below navbar */}
      <div className="flex flex-1 overflow-hidden pt-16">

        {/* ── Left panel (list) ── */}
        <div
          className={`w-full lg:w-[520px] lg:flex-shrink-0 flex flex-col overflow-y-auto ${
            mobileView === 'map' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="px-6 pt-6 pb-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-unc-navy">Subleases in Chapel Hill</h1>
                <p className="text-slate-body mt-0.5 text-sm">
                  {loading
                    ? 'Loading...'
                    : `${listings.length} listing${listings.length !== 1 ? 's' : ''} available`}
                </p>
              </div>
              {isAuthed && (
                <Link
                  to="/post"
                  className="inline-flex items-center gap-1.5 bg-unc-navy text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-[#1c3a6b] transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" /> Post a listing
                </Link>
              )}
            </div>

            {/* Filters (horizontal) */}
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(EMPTY_FILTERS)}
            />
          </div>

          {/* Cards */}
          <div className="px-6 pb-8 flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-gray-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-24 px-4">
                {hasActiveFilters(filters) ? (
                  <>
                    <p className="text-slate-400 text-lg font-medium mb-2">No listings match your filters</p>
                    <p className="text-slate-300 text-sm mb-4">Try adjusting or clearing your filters</p>
                    <button
                      onClick={() => setFilters(EMPTY_FILTERS)}
                      className="text-unc-blue text-sm font-medium hover:underline"
                    >
                      Clear filters
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-unc-navy mb-2">No listings yet</p>
                    <p className="text-slate-400 text-sm mb-6">Be the first UNC student to post a sublease on Purch.</p>
                    {isAuthed ? (
                      <Link
                        to="/post"
                        className="inline-flex items-center gap-2 bg-unc-navy text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-[#1c3a6b] transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Post a listing
                      </Link>
                    ) : (
                      <p className="text-slate-400 text-sm">
                        <Link to="/" className="text-unc-blue font-medium hover:underline">Sign in</Link> to post the first listing.
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
              >
                {listings.map(l => (
                  <motion.div
                    key={l.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.45,
                          ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                        },
                      },
                    }}
                    onMouseEnter={() => setHoveredId(l.id)}
                    onMouseLeave={() => setHoveredId(null)}
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

        {/* ── Right panel (map) ── */}
        <div
          className={`flex-1 ${
            mobileView === 'map' ? 'block' : 'hidden lg:block'
          }`}
        >
          <BrowseMap listings={listings} hoveredId={hoveredId} />
        </div>
      </div>

      {/* ── Mobile toggle ── */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setMobileView(v => (v === 'list' ? 'map' : 'list'))}
          className="inline-flex items-center gap-2 bg-unc-navy text-white text-sm font-semibold px-5 py-3 rounded-full shadow-xl hover:bg-[#1c3a6b] transition-colors"
        >
          {mobileView === 'list' ? (
            <><MapIcon className="w-4 h-4" /> Show map</>
          ) : (
            <><List className="w-4 h-4" /> Show listings</>
          )}
        </button>
      </div>
    </div>
  )
}
