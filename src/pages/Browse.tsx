import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X, Plus, Map as MapIcon, List, SearchX } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { ListingCard } from '../components/listings/ListingCard'
import { PurchedStat, RecentlyPurchedStrip } from '../components/listings/RecentlyPurched'
import { BrowseMap } from '../components/map/BrowseMap'
import { Eyebrow } from '../components/ui/Eyebrow'
import { button } from '../components/ui/styles'
import { useListings, type Filters, type SortOption } from '../hooks/useListings'
import { useAuth } from '../hooks/useAuth'
import { useSavedListings } from '../hooks/useSavedListings'
import { usePurchedCount, useRecentlyPurched } from '../hooks/usePurched'
import { cn } from '../lib/utils'

const filterLabel = 'text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted whitespace-nowrap'
const filterInput = 'h-9 px-3 rounded-[10px] border border-brand-line bg-white text-sm text-brand-navy outline-none focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/25 transition'

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'h-9 px-3.5 rounded-full text-sm font-semibold transition-colors',
        active ? 'bg-brand-navy text-white' : 'bg-white text-brand-navy border border-brand-line hover:bg-brand-mist',
      )}
    >
      {children}
    </button>
  )
}

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
    <div className="mb-6 rounded-2xl bg-brand-mist p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-outfit text-base font-bold flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-sky-ink" /> Filters
        </h2>
        {hasFilters && (
          <button
            onClick={onReset}
            className="text-[13px] font-semibold flex items-center gap-1 text-brand-muted hover:text-brand-navy transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-4">
        {/* Price */}
        <div className="flex items-center gap-2 min-w-0">
          <span className={filterLabel}>
            Price
          </span>
          <input
            type="number"
            placeholder="Min"
            value={filters.minRent ?? ''}
            onChange={e =>
              onChange({ ...filters, minRent: e.target.value ? +e.target.value : undefined })
            }
            className={cn(filterInput, 'w-24')}
          />
          <span className="text-brand-subtle text-sm">–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxRent ?? ''}
            onChange={e =>
              onChange({ ...filters, maxRent: e.target.value ? +e.target.value : undefined })
            }
            className={cn(filterInput, 'w-24')}
          />
        </div>

        {/* Bedrooms */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={filterLabel}>
            Beds
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: 'Any', value: -1 },
              { label: 'Studio', value: 0 },
              { label: '1', value: 1 },
              { label: '2', value: 2 },
              { label: '3+', value: 3 },
            ].map(opt => (
              <Pill
                key={opt.value}
                active={(filters.bedrooms ?? -1) === opt.value}
                onClick={() => onChange({ ...filters, bedrooms: opt.value })}
              >
                {opt.label}
              </Pill>
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
              className="w-4 h-4 accent-brand-sky"
            />
            <span className={filterLabel}>
              Furnished
            </span>
          </label>
        </div>

        {/* Available by */}
        <div className="flex items-center gap-2">
          <span className={filterLabel}>
            Available by
          </span>
          <input
            type="date"
            value={filters.availableFrom ?? ''}
            onChange={e =>
              onChange({ ...filters, availableFrom: e.target.value || undefined })
            }
            className={filterInput}
          />
        </div>

        {/* Gender preference */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={filterLabel}>
            Looking for
          </span>
          <div className="flex gap-1.5">
            {([
              { label: 'Any', value: undefined },
              { label: 'Female', value: 'female' as const },
              { label: 'Male', value: 'male' as const },
            ] as const).map(opt => (
              <Pill
                key={opt.label}
                active={(filters.preferredGender ?? undefined) === opt.value}
                onClick={() => onChange({ ...filters, preferredGender: opt.value })}
              >
                {opt.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className={filterLabel}>
            Sort
          </span>
          <select
            value={filters.sort ?? 'newest'}
            onChange={e => onChange({ ...filters, sort: e.target.value as SortOption })}
            className={cn(filterInput, 'cursor-pointer')}
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

// Seeds filters from links like /browse?from=2027-01-05&to=2027-05-10&maxRent=900&furnished=1
function filtersFromParams(params: URLSearchParams): Filters {
  const maxRent = Number(params.get('maxRent'))
  return {
    ...EMPTY_FILTERS,
    maxRent: maxRent > 0 ? maxRent : undefined,
    availableFrom: params.get('from') || undefined,
    availableTo: params.get('to') || undefined,
    furnished: params.get('furnished') === '1' || undefined,
  }
}

function hasActiveFilters(f: Filters) {
  return f.minRent !== undefined || f.maxRent !== undefined ||
    (f.bedrooms !== undefined && f.bedrooms !== -1) ||
    f.furnished || f.availableFrom !== undefined || f.availableTo !== undefined ||
    f.preferredGender !== undefined
}

export default function Browse() {
  const { isAuthed } = useAuth()
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<Filters>(() => filtersFromParams(searchParams))
  // Map + grid only ever get `listings` (is_active = true). Purch'd data stays in its own strip.
  const { listings, loading } = useListings(filters)
  const purchedCount = usePurchedCount()
  const recentlyPurched = useRecentlyPurched()
  const { savedIds, toggleSave } = useSavedListings()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')

  return (
    <PageShell footer={false}>
      {/* Split layout fills the viewport under the 72px header (and above the 64px mobile tab bar) */}
      <div className="flex h-[calc(100dvh-136px)] md:h-[calc(100dvh-72px)] overflow-hidden">

        {/* ── Left panel (list) ── */}
        <div
          className={`w-full lg:w-[560px] xl:w-[640px] lg:flex-shrink-0 flex flex-col overflow-y-auto ${
            mobileView === 'map' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="px-5 sm:px-8 pt-8 pb-2">
            {/* Header */}
            <div className="flex items-end justify-between gap-4 mb-6">
              <div className="flex flex-col gap-2">
                <Eyebrow>CHAPEL HILL · UNC</Eyebrow>
                <h1 className="font-outfit text-[32px] sm:text-4xl leading-none font-extrabold tracking-[-0.03em]">
                  Subleases near campus
                </h1>
                <p className="text-[15px] text-brand-muted">
                  {loading
                    ? 'Loading...'
                    : `${listings.length} listing${listings.length !== 1 ? 's' : ''} available`}
                </p>
                <PurchedStat count={purchedCount} className="mt-1" />
              </div>
              {isAuthed && (
                <Link to="/post" className={button('dark', 'sm', 'whitespace-nowrap flex-shrink-0')}>
                  <Plus className="w-4 h-4" /> Post a listing
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
          <div className="px-5 sm:px-8 pb-24 lg:pb-10 flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-brand-line overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-brand-mist" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-brand-mist rounded w-3/4" />
                      <div className="h-3 bg-brand-mist rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16 px-6 rounded-2xl bg-brand-mist flex flex-col items-center">
                {hasActiveFilters(filters) ? (
                  <>
                    <span className="w-12 h-12 rounded-[12px] bg-brand-navy text-brand-sky flex items-center justify-center mb-4">
                      <SearchX className="w-5 h-5" />
                    </span>
                    <p className="font-outfit text-xl font-bold mb-1">No listings match your filters</p>
                    <p className="text-[15px] text-brand-muted mb-5">Try adjusting or clearing your filters</p>
                    <button
                      onClick={() => setFilters(EMPTY_FILTERS)}
                      className={button('primary', 'sm')}
                    >
                      Clear filters
                    </button>
                  </>
                ) : (
                  <>
                    <img src="/brand/purch_exact_mark.svg" alt="" className="h-14 w-auto mb-4" />
                    <p className="font-outfit text-2xl font-extrabold tracking-[-0.02em] mb-1">No listings yet</p>
                    <p className="text-[15px] text-brand-muted mb-6">Be the first UNC student to post a sublease on Purch.</p>
                    {isAuthed ? (
                      <Link to="/post" className={button('primary', 'sm')}>
                        <Plus className="w-4 h-4" /> Post a listing
                      </Link>
                    ) : (
                      <p className="text-[15px] text-brand-muted">
                        <Link to="/" className="font-semibold text-brand-navy underline underline-offset-4">Sign in</Link> to post the first listing.
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

            {!loading && <RecentlyPurchedStrip items={recentlyPurched} count={purchedCount} />}
          </div>
        </div>

        {/* ── Right panel (map) ── */}
        <div
          className={`flex-1 bg-brand-map ${
            mobileView === 'map' ? 'block' : 'hidden lg:block'
          }`}
        >
          <BrowseMap listings={listings} hoveredId={hoveredId} />
        </div>
      </div>

      {/* ── Mobile toggle (sits above the mobile tab bar) ── */}
      <div className="lg:hidden fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setMobileView(v => (v === 'list' ? 'map' : 'list'))}
          className="inline-flex items-center gap-2 text-[15px] font-bold px-5 py-3 rounded-full bg-brand-sky text-brand-navy shadow-[0_10px_30px_rgba(5,30,55,0.35)] hover:brightness-105 transition"
        >
          {mobileView === 'list' ? (
            <><MapIcon className="w-4 h-4" /> Show map</>
          ) : (
            <><List className="w-4 h-4" /> Show listings</>
          )}
        </button>
      </div>
    </PageShell>
  )
}
