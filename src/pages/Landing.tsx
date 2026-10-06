import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { SignInModal } from '../components/auth/SignInModal'
import { PageShell } from '../components/layout/PageShell'
import { Reveal } from '../components/ui/Reveal'
import { Eyebrow } from '../components/ui/Eyebrow'
import { button, container, heroHeading, lede, sectionHeading, subHeading, textLink } from '../components/ui/styles'
import { useAuth } from '../hooks/useAuth'
import { usePurchedCount } from '../hooks/usePurched'
import { PurchedStat } from '../components/listings/RecentlyPurched'
import { supabase } from '../lib/supabase'
import type { Listing } from '../types'
import { cn } from '../lib/utils'

// ── Walk-time helpers ─────────────────────────────────────────
// Places students commute to. Walk times are straight-line distance
// padded for street grid (×1.3) at ~80 m per minute.
const DESTINATIONS = [
  { id: 'polk-place',    label: 'Polk Place',    lat: 35.9109, lng: -79.0505 },
  { id: 'kenan-flagler', label: 'Kenan-Flagler', lat: 35.9055, lng: -79.0452 },
  { id: 'unc-hospitals', label: 'UNC Hospitals', lat: 35.9036, lng: -79.0520 },
  { id: 'franklin-st',   label: 'Franklin St',   lat: 35.9132, lng: -79.0558 },
] as const

type Destination = (typeof DESTINATIONS)[number]
type LandingListing = Pick<
  Listing,
  'id' | 'address' | 'rent' | 'bedrooms' | 'is_furnished' | 'photos' | 'available_from' | 'available_to' | 'lat' | 'lng'
>

function walkMinutes(l: LandingListing, dest: Destination) {
  if (l.lat == null || l.lng == null) return null
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(dest.lat - l.lat)
  const dLng = toRad(dest.lng - l.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(l.lat)) * Math.cos(toRad(dest.lat)) * Math.sin(dLng / 2) ** 2
  const meters = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.max(1, Math.round((meters * 1.3) / 80))
}

function byWalk(listings: LandingListing[], dest: Destination) {
  return listings
    .map(l => ({ listing: l, minutes: walkMinutes(l, dest) }))
    .filter((r): r is { listing: LandingListing; minutes: number } => r.minutes !== null)
    .sort((a, b) => a.minutes - b.minutes)
}

// ── Formatting ────────────────────────────────────────────────
function streetName(address: string) {
  const first = address.split(',')[0]?.trim() ?? ''
  return first.replace(/^\d+[A-Za-z]?\s+/, '') || 'Chapel Hill'
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function listingSummary(l: LandingListing) {
  const unit = l.bedrooms === 0 ? 'Studio' : `${l.bedrooms}BR`
  return `${unit} · ${l.is_furnished ? 'Furnished' : 'Unfurnished'} · ${shortDate(l.available_from)} – ${shortDate(l.available_to)}`
}

function rent(n: number) {
  return `$${n.toLocaleString()}`
}

// Next summer's sublease window, for the Summer suggestion
function summerParams() {
  const now = new Date()
  const year = now.getMonth() > 6 ? now.getFullYear() + 1 : now.getFullYear()
  return `from=${year}-05-20&to=${year}-07-31`
}

// ── Data ──────────────────────────────────────────────────────
function useLandingListings() {
  const [listings, setListings] = useState<LandingListing[]>([])
  useEffect(() => {
    supabase
      .from('listings')
      .select('id, address, rent, bedrooms, is_furnished, photos, available_from, available_to, lat, lng')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => setListings((data ?? []) as LandingListing[]))
  }, [])
  return listings
}

// ── Icons ─────────────────────────────────────────────────────
function WalkIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  )
}

const inputShell = 'h-14 flex items-center gap-4 px-[18px] rounded-[10px] bg-white'
const inputBase = 'flex-1 min-w-0 bg-transparent border-0 outline-none text-[17px] font-medium text-brand-navy placeholder:text-brand-muted'

// ── Hero ──────────────────────────────────────────────────────
function DateField({ label, value, onChange, marker }: {
  label: string
  value: string
  onChange: (v: string) => void
  marker: React.ReactNode
}) {
  // Text until focused so the placeholder shows; native date picker once focused
  const [type, setType] = useState<'text' | 'date'>(value ? 'date' : 'text')
  return (
    <label className={inputShell}>
      {marker}
      <input
        type={type}
        aria-label={label}
        placeholder={label}
        value={value}
        onFocus={() => setType('date')}
        onBlur={() => { if (!value) setType('text') }}
        onChange={e => onChange(e.target.value)}
        className={inputBase}
      />
    </label>
  )
}

function SearchForm() {
  const navigate = useNavigate()
  const [moveIn, setMoveIn] = useState('')
  const [moveOut, setMoveOut] = useState('')
  const [walkTo, setWalkTo] = useState<string>(DESTINATIONS[0].id)
  const [budget, setBudget] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (moveIn) params.set('from', moveIn)
    if (moveOut) params.set('to', moveOut)
    if (Number(budget) > 0) params.set('maxRent', String(Number(budget)))
    params.set('walkTo', walkTo)
    navigate(`/browse?${params}`)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5 max-w-[540px]">
      <div className="relative flex flex-col gap-2.5">
        <span className="absolute left-[22px] top-9 w-0.5 h-[66px] bg-brand-sky" aria-hidden="true" />
        <DateField
          label="Move-in date"
          value={moveIn}
          onChange={setMoveIn}
          marker={<span className="w-2.5 h-2.5 rounded-full bg-brand-sky shadow-[0_0_0_3px_#CFE5FF] shrink-0 relative" />}
        />
        <DateField
          label="Move-out date"
          value={moveOut}
          onChange={setMoveOut}
          marker={<span className="w-2.5 h-2.5 bg-brand-navy shrink-0 relative" />}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <label className={cn(inputShell, 'gap-3 px-4')}>
          <WalkIcon className="w-[18px] h-[18px] text-brand-navy shrink-0" />
          <select
            aria-label="Where you need to be"
            value={walkTo}
            onChange={e => setWalkTo(e.target.value)}
            className={cn(inputBase, 'appearance-none cursor-pointer')}
          >
            {DESTINATIONS.map(d => (
              <option key={d.id} value={d.id}>Walk to {d.label}</option>
            ))}
          </select>
        </label>
        <label className={cn(inputShell, 'gap-3 px-4')}>
          <svg className="w-4 h-4 text-brand-navy shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            aria-label="Monthly budget"
            placeholder="Monthly budget"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            className={inputBase}
          />
        </label>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-[22px] gap-y-3">
        <button type="submit" className={button('primary', 'lg')}>
          See listings
        </button>
        <Link to="/browse" className="text-base font-medium underline underline-offset-4 text-white hover:text-brand-sky transition-colors">
          Or browse the map
        </Link>
      </div>
    </form>
  )
}

function HeroMap({ listings }: { listings: LandingListing[] }) {
  const polk = DESTINATIONS[0]
  const closest = byWalk(listings, polk)
  const featured = closest[0]
  const others = listings.filter(l => l.id !== featured?.listing.id).slice(0, 3)
  // Illustrative pin spots (percent of the map), not real coordinates
  const pinSpots = [
    { left: '75.3%', top: '17.7%' },
    { left: '9.6%',  top: '65.2%' },
    { left: '81.1%', top: '48.4%' },
  ]

  return (
    <div className="relative h-[440px] sm:h-[540px] lg:h-[620px] rounded-[18px] overflow-hidden bg-brand-map">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 624 620" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="624" height="620" fill="#E6ECF2" />
        <path d="M300 250 L480 228 L500 390 L318 412 Z" fill="#D3E1F1" />
        <path d="M90 -10 L110 630" stroke="#FFFFFF" strokeWidth="8" fill="none" />
        <path d="M232 -10 L240 630" stroke="#FFFFFF" strokeWidth="12" fill="none" />
        <path d="M400 -10 L420 630" stroke="#FFFFFF" strokeWidth="16" fill="none" />
        <path d="M560 -10 L548 630" stroke="#FFFFFF" strokeWidth="8" fill="none" />
        <path d="M-10 160 Q300 140 640 170" stroke="#FFFFFF" strokeWidth="16" fill="none" />
        <path d="M-10 300 L640 292" stroke="#FFFFFF" strokeWidth="6" fill="none" />
        <path d="M-10 480 Q300 462 640 494" stroke="#FFFFFF" strokeWidth="18" fill="none" />
        <path d="M-10 70 L640 84" stroke="#FFFFFF" strokeWidth="6" fill="none" />
        <text x="360" y="345" fontFamily="Figtree" fontSize="13" fontWeight="700" fill="#5B6B7E">UNC Campus</text>
        <text x="18" y="150" fontFamily="Figtree" fontSize="12" fill="#5B6B7E">W Rosemary St</text>
        <text x="440" y="470" fontFamily="Figtree" fontSize="12" fill="#5B6B7E">E Cameron Ave</text>
        {featured && (
          <>
            <path d="M400 372 L396 294 L240 290 L236 166" stroke="#051E37" strokeWidth="5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
            <rect x="228" y="158" width="16" height="16" fill="#051E37" stroke="#FFFFFF" strokeWidth="3" />
          </>
        )}
        <circle cx="400" cy="372" r="10" fill="#55A7FE" stroke="#FFFFFF" strokeWidth="4" />
      </svg>

      <span className="absolute left-[66.3%] top-[62.3%] px-2.5 py-1.5 rounded-md bg-white text-[13px] font-bold text-brand-navy shadow-[0_2px_8px_rgba(5,30,55,0.18)]">
        Polk Place
      </span>

      {others.map((l, i) => (
        <span
          key={l.id}
          className="absolute px-2.5 py-1.5 rounded-md bg-white text-[13px] font-bold text-brand-navy shadow-[0_2px_8px_rgba(5,30,55,0.18)]"
          style={pinSpots[i]}
        >
          {rent(l.rent)}
        </span>
      ))}

      {featured && (
        <>
          <span className="absolute left-[40.4%] top-[19.4%] px-2.5 py-1.5 rounded-md bg-brand-navy text-white text-[13px] font-bold">
            {rent(featured.listing.rent)}
          </span>
          <div className="absolute left-[42%] top-[35.8%] flex flex-col px-3 py-2 rounded-lg bg-brand-navy text-white">
            <span className="font-outfit text-xl font-extrabold leading-none text-brand-sky">{featured.minutes} min</span>
            <span className="text-xs text-[#C9D5E3]">walk to class</span>
          </div>

          <Link
            to={`/listings/${featured.listing.id}`}
            className="absolute left-4 right-4 bottom-4 sm:left-6 sm:right-6 sm:bottom-6 flex gap-3.5 items-center p-3.5 rounded-[14px] bg-white text-brand-navy shadow-[0_12px_32px_rgba(5,30,55,0.22)] hover:-translate-y-0.5 transition-transform"
          >
            {featured.listing.photos?.[0] ? (
              <img src={featured.listing.photos[0]} alt="" className="w-16 h-16 shrink-0 rounded-[10px] object-cover" />
            ) : (
              <span className="w-16 h-16 shrink-0 rounded-[10px] bg-brand-navy flex items-center justify-center">
                <img src="/brand/purch_exact_mark.svg" alt="" className="h-9 w-auto" />
              </span>
            )}
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="text-[17px] font-bold truncate">{streetName(featured.listing.address)}</span>
              <span className="text-sm text-brand-muted truncate">{listingSummary(featured.listing)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-outfit text-[22px] font-extrabold">{rent(featured.listing.rent)}</span>
              <span className="text-xs text-brand-muted">per month</span>
            </div>
          </Link>
        </>
      )}
    </div>
  )
}

function Hero({ listings, onPost }: { listings: LandingListing[]; onPost: () => void }) {
  const [tab, setTab] = useState<'find' | 'post'>('find')

  return (
    <section className="bg-brand-navy text-white">
      <div className={cn(container, 'pt-12 lg:pt-[72px] pb-16 lg:pb-[104px] grid lg:grid-cols-2 gap-12 lg:gap-16 items-center')}>
        <div className="flex flex-col gap-[26px]">
          <Eyebrow onDark>STUDENT SUBLEASES · UNC</Eyebrow>
          <div role="tablist" aria-label="What are you here to do?" className="flex gap-7 border-b border-brand-navy-2">
            {([['find', 'Find a place'], ['post', 'Post your place']] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`pb-3 border-b-[3px] -mb-px text-base transition-colors ${
                  tab === id ? 'border-brand-sky font-bold text-white' : 'border-transparent font-medium text-brand-subtle hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'find' ? (
            <>
              <h1 className={heroHeading}>
                Find a place <span className="text-brand-sky">near campus.</span>
              </h1>
              <p className="text-lg lg:text-[19px] leading-normal text-brand-subtle max-w-[520px]">
                Subleases from verified UNC students. Tell us where you need to be, and every place shows how far the walk is.
              </p>
              <SearchForm />
            </>
          ) : (
            <>
              <h1 className={heroHeading}>
                Hand off your lease <span className="text-brand-sky">in minutes.</span>
              </h1>
              <p className="text-lg lg:text-[19px] leading-normal text-brand-subtle max-w-[520px]">
                Post your place for free. Only verified @unc.edu students can see your address and message you.
              </p>
              <div>
                <button type="button" onClick={onPost} className={button('primary', 'lg')}>
                  Post your place
                </button>
              </div>
            </>
          )}
        </div>

        <HeroMap listings={listings} />
      </div>
    </section>
  )
}

// ── Suggestions ───────────────────────────────────────────────
function Suggestions() {
  const tiles = [
    { title: 'Walk to class', desc: 'Under 15 minutes from Polk Place', img: '/landing/walk-to-class.jpg', to: '/browse?walkTo=polk-place' },
    { title: 'Whole place',   desc: 'The entire apartment to yourself', img: '/landing/whole-place.jpg',   to: '/browse' },
    { title: 'Summer',        desc: 'Internship and summer-school dates', img: '/landing/summer.jpg',      to: `/browse?${summerParams()}` },
    { title: 'Furnished',     desc: 'Bring a suitcase, not a U-Haul',   img: '/landing/furnished.jpg',     to: '/browse?furnished=1' },
  ]

  return (
    <section className={cn(container, 'pt-20 lg:pt-[104px] pb-20 lg:pb-28')}>
      <Reveal className="flex flex-col gap-7">
        <div className="flex flex-col gap-2.5">
          <Eyebrow>SUGGESTIONS</Eyebrow>
          <h2 className={subHeading}>Start with how you live.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map(t => (
            <Link
              key={t.title}
              to={t.to}
              className="h-40 flex justify-between gap-3 p-5 rounded-2xl bg-brand-mist text-brand-navy overflow-hidden hover:bg-[#E4EAF2] transition-colors"
            >
              <div className="flex flex-col justify-between">
                <div className="flex flex-col gap-1.5">
                  <span className="font-outfit text-[19px] font-bold">{t.title}</span>
                  <span className="text-sm leading-snug text-brand-muted max-w-[150px]">{t.desc}</span>
                </div>
                <span className="self-start px-3 py-1.5 rounded-full bg-brand-navy text-white text-[13px] font-semibold">Details</span>
              </div>
              <img src={t.img} alt="" className="w-[104px] h-[120px] shrink-0 self-center rounded-xl object-cover" />
            </Link>
          ))}
        </div>
      </Reveal>
    </section>
  )
}

// ── Distance first ────────────────────────────────────────────
function DistanceFirst({ listings }: { listings: LandingListing[] }) {
  const [destId, setDestId] = useState<Destination['id']>(DESTINATIONS[0].id)
  const dest = DESTINATIONS.find(d => d.id === destId) ?? DESTINATIONS[0]
  const rows = useMemo(() => byWalk(listings, dest).slice(0, 3), [listings, dest])

  return (
    <section className={cn(container, 'pb-20 lg:pb-28')}>
      <Reveal className="p-6 sm:p-10 lg:p-[72px] rounded-[20px] bg-brand-mist grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-10 lg:gap-[72px] items-center">
        <div className="flex flex-col gap-5">
          <Eyebrow>DISTANCE FIRST</Eyebrow>
          <h2 className={sectionHeading}>
            Pick where you need to be. We sort by the walk.
          </h2>
          <p className={cn(lede, 'max-w-[460px]')}>
            Choose a spot on campus and see which places are the shortest walk from it.
          </p>
          <Link to="/browse" className={button('dark', 'md', 'self-start')}>
            Open the map
          </Link>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl bg-white shadow-[0_10px_30px_rgba(5,30,55,0.08)] flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap">
            {DESTINATIONS.map(d => (
              <button
                key={d.id}
                type="button"
                aria-pressed={d.id === destId}
                onClick={() => setDestId(d.id)}
                className={`h-[38px] px-4 rounded-full text-sm font-semibold transition-colors ${
                  d.id === destId ? 'bg-brand-navy text-white' : 'bg-brand-mist text-brand-navy hover:bg-[#E4EAF2]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {rows.length === 0 ? (
            <p className="px-2.5 py-8 text-center text-brand-muted">New listings show up here as students post them.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {rows.map(({ listing, minutes }) => (
                <Link
                  key={listing.id}
                  to={`/listings/${listing.id}`}
                  className="flex items-center gap-4 p-2.5 rounded-xl text-brand-navy hover:bg-brand-mist transition-colors"
                >
                  <span className="w-[72px] h-16 shrink-0 rounded-[10px] bg-brand-navy flex flex-col items-center justify-center">
                    <span className="font-outfit text-2xl font-extrabold leading-none text-brand-sky">{minutes}</span>
                    <span className="text-[11px] text-[#C9D5E3]">min walk</span>
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-[17px] font-bold truncate">{streetName(listing.address)}</span>
                    <span className="text-sm text-brand-muted truncate">{listingSummary(listing)}</span>
                  </div>
                  <span className="font-outfit text-xl font-extrabold">{rent(listing.rent)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </section>
  )
}

// ── Hosts + verification ──────────────────────────────────────
function SplitSection({ img, alt, imageFirst, children }: {
  img: string
  alt: string
  imageFirst: boolean
  children: React.ReactNode
}) {
  return (
    <section className={cn(container, 'pb-20 lg:pb-28')}>
      <Reveal className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        <div className={`h-[320px] sm:h-[440px] lg:h-[540px] rounded-[18px] overflow-hidden ${imageFirst ? '' : 'lg:order-2'}`}>
          <img src={img} alt={alt} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-5">{children}</div>
      </Reveal>
    </section>
  )
}

const splitBody = cn(lede, 'max-w-[500px]')

// ── Sign-in band ──────────────────────────────────────────────
function SignInBand({ onCodeSent }: { onCodeSent: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!trimmed.endsWith('@unc.edu') && !trimmed.endsWith('@ad.unc.edu')) {
      setError('Use your @unc.edu or @ad.unc.edu email.')
      return
    }
    setSending(true)
    const { error: authError } = await supabase.auth.signInWithOtp({ email: trimmed })
    setSending(false)
    if (authError) setError(authError.message)
    else onCodeSent(trimmed)
  }

  return (
    <section className={cn(container, 'pb-20 lg:pb-24')}>
      <Reveal className="p-8 sm:p-12 lg:p-16 rounded-[20px] bg-brand-navy text-white flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12">
        <div className="flex items-center gap-6 lg:gap-7">
          <img src="/brand/purch_exact_mark.svg" alt="" className="h-16 lg:h-[84px] w-auto block shrink-0" />
          <h2 className="font-outfit text-3xl sm:text-4xl lg:text-[44px] leading-[1.02] font-extrabold tracking-[-0.03em] max-w-[480px]">
            Sign in with your @unc.edu. No password.
          </h2>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <label className="sm:w-[300px] h-14 flex items-center px-[18px] rounded-[10px] bg-white">
              <input
                type="email"
                aria-label="UNC email"
                placeholder="onyen@unc.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[17px] text-brand-navy placeholder:text-brand-muted"
              />
            </label>
            <button type="submit" disabled={sending} className={button('primary', 'lg', 'px-6')}>
              {sending ? 'Sending…' : 'Send code'}
            </button>
          </div>
          {error && <p className="text-sm text-[#FFB4A8]">{error}</p>}
        </form>
      </Reveal>
    </section>
  )
}

// ── Main Landing export ───────────────────────────────────────
export default function Landing() {
  const { isAuthed } = useAuth()
  const navigate = useNavigate()
  const listings = useLandingListings()
  const purchedCount = usePurchedCount()
  const [signIn, setSignIn] = useState<{ email?: string; step?: 'email' | 'code' } | null>(null)
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    supabase.from('page_views').insert({}).then(() => {})
  }, [])

  // The header owns its own sign-in modal; this one serves the page's own CTAs
  function goToPost() {
    if (isAuthed) navigate('/post')
    else setSignIn({})
  }

  return (
    <PageShell>
      <AnimatePresence>
        {signIn && (
          <SignInModal
            onClose={() => setSignIn(null)}
            initialEmail={signIn.email}
            initialStep={signIn.step}
          />
        )}
      </AnimatePresence>

      <Hero listings={listings} onPost={goToPost} />
      <Suggestions />
      <DistanceFirst listings={listings} />

      <SplitSection img="/landing/kitchen.jpg" alt="Clean apartment kitchen" imageFirst>
        <Eyebrow>FOR HOSTS</Eyebrow>
        <h2 className={sectionHeading}>Don’t pay rent on an empty room.</h2>
        <p className={splitBody}>
          Studying abroad, interning, graduating early? Post your place for free and let a verified Tar Heel take over the lease.
        </p>
        <PurchedStat count={purchedCount} />
        <div className="flex flex-wrap items-center gap-5">
          <button type="button" onClick={goToPost} className={button('dark', 'md')}>
            Post your place
          </button>
          <Link to="/about" className={textLink}>
            How subleasing works
          </Link>
        </div>
      </SplitSection>

      <SplitSection img="/landing/plants.jpg" alt="Living room full of plants" imageFirst={false}>
        <Eyebrow>VERIFIED</Eyebrow>
        <h2 className={sectionHeading}>Every host is a verified Tar Heel.</h2>
        <p className={splitBody}>
          Everyone on Purch signs in with a code sent to their @unc.edu. Every pin is a real address, and every conversation stays in one thread.
        </p>
        <Link to="/about" className={cn(textLink, 'self-start')}>
          How verification works
        </Link>
      </SplitSection>

      {!isAuthed && <SignInBand onCodeSent={email => setSignIn({ email, step: 'code' })} />}
    </PageShell>
  )
}
