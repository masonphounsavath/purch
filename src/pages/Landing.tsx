import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '../components/layout/Navbar'
import { SignInModal } from '../components/auth/SignInModal'
import { PurchLogo } from '../components/ui/PurchLogo'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

// ── Animated counter ──────────────────────────────────────────
function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) return
    const duration = 1400
    const startTime = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <>{display.toLocaleString()}</>
}

// ── Shared primitives ─────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  y = 18,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease, delay }}
    >
      {children}
    </motion.div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono uppercase text-[11px] tracking-[0.14em]" style={{ color: 'var(--muted)' }}>
      {children}
    </p>
  )
}

function Btn({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'ghost' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  className?: string
}) {
  const variants = {
    primary: { background: 'var(--ink)', color: 'var(--bg)', border: '1px solid transparent' },
    accent:  { background: 'var(--accent)', color: 'white', border: '1px solid transparent' },
    outline: { background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)' },
    ghost:   { background: 'transparent', color: 'var(--ink)', border: '1px solid transparent' },
  }
  const sizes = {
    sm: { padding: '7px 12px', fontSize: 12.5 },
    md: { padding: '10px 16px', fontSize: 13.5 },
    lg: { padding: '14px 22px', fontSize: 15 },
  }
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ y: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`inline-flex items-center gap-2 rounded-full font-medium eased ${className}`}
      style={{ ...variants[variant], ...sizes[size] }}
    >
      {children}
      {icon}
    </motion.button>
  )
}

// Placeholder photo using design-system CSS classes
function Photo({
  label = 'chapel hill · photo',
  tone = 'warm',
  aspect = '4/3',
  className = '',
}: {
  label?: string
  tone?: 'warm' | 'blue' | 'green' | 'dusk' | 'neutral'
  aspect?: string
  className?: string
}) {
  const toneClass = { warm: 'ph-accent', blue: 'ph-blue', green: 'ph-green', dusk: 'ph-dusk', neutral: '' }[tone] ?? ''
  return (
    <div
      className={`ph ${toneClass} rounded-2xl ${className}`}
      data-label={label}
      style={{ aspectRatio: aspect }}
    />
  )
}

// ── Arrow icons ───────────────────────────────────────────────
function ArrowR() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

// ── Mini postcard for hero ────────────────────────────────────
function PostcardMini({ tone, label, price }: { tone: 'warm' | 'blue' | 'green' | 'dusk'; label: string; price: string }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl" style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}>
      <Photo label={label} tone={tone} aspect="4/3" className="rounded-none" />
      <div className="px-2.5 py-2 flex items-center justify-between">
        <span className="font-display tabnum" style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>{price}</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--muted)' }}>/mo</span>
      </div>
    </div>
  )
}

// ── Birdhouse + floating postcards vignette ───────────────────
function HeroVignette() {
  return (
    <div className="relative" style={{ aspectRatio: '4/5' }}>
      {/* Big birdhouse illustration */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 grid place-items-center"
      >
        <svg viewBox="0 0 200 260" className="w-[82%] h-auto" fill="none">
          <ellipse cx="100" cy="252" rx="40" ry="5" fill="currentColor" opacity="0.08" />
          <path d="M100 210 L100 250" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M34 90 L100 20 L166 90 Z" fill="var(--accent)" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="100" cy="16" r="4" fill="currentColor" />
          <rect x="46" y="86" width="108" height="124" rx="3" fill="var(--paper)" stroke="currentColor" strokeWidth="2.5" />
          <path d="M46 120 L154 120" stroke="currentColor" strokeWidth="1" opacity="0.25" />
          <path d="M46 160 L154 160" stroke="currentColor" strokeWidth="1" opacity="0.25" />
          <path d="M46 195 L154 195" stroke="currentColor" strokeWidth="1" opacity="0.25" />
          <circle cx="100" cy="140" r="22" fill="currentColor" opacity="0.9" />
          <circle cx="100" cy="140" r="22" fill="none" stroke="var(--accent)" strokeWidth="1.8" opacity="0.55" />
          <path d="M84 175 L116 175" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="84" cy="175" r="2" fill="currentColor" />
          <circle cx="116" cy="175" r="2" fill="currentColor" />
          <g transform="translate(94 154)">
            <path d="M0 15 C 0 6, 7 0, 14 0 C 22 0, 28 6, 28 14 C 28 17, 27 19, 25 21 L 28 25 C 29 26, 28 28, 26 28 L 4 28 C 2 28, 0 26, 0 25 Z"
              fill="var(--paper)" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M10 12 C 14 8, 20 8, 23 12 C 21 18, 15 20, 11 17 Z" fill="currentColor" opacity="0.85" />
            <path d="M0 14 L -5 16 L 0 19 Z" fill="var(--accent)" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx="6" cy="10" r="1.6" fill="currentColor" />
            <circle cx="6.4" cy="9.4" r="0.5" fill="var(--paper)" />
            <path d="M28 20 L 36 17 L 34 24 Z" fill="var(--paper)" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </g>
        </svg>
      </motion.div>

      {/* Floating listing postcards */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -10 }}
        animate={{ opacity: 1, y: 0, rotate: -8 }}
        transition={{ delay: 0.4, duration: 0.7, ease }}
        className="absolute top-[18%] left-[2%] w-[140px]"
      >
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}>
          <PostcardMini tone="green" label="Carrboro studio" price="$720" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20, rotate: 6 }}
        animate={{ opacity: 1, y: 0, rotate: 5 }}
        transition={{ delay: 0.55, duration: 0.7, ease }}
        className="absolute bottom-[18%] right-[0%] w-[150px]"
      >
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}>
          <PostcardMini tone="dusk" label="Franklin 2BR" price="$875" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ delay: 0.7, duration: 0.7, ease }}
        className="absolute bottom-[4%] left-[10%] w-[120px]"
      >
        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}>
          <PostcardMini tone="warm" label="Mill Creek 3BR" price="$1,120" />
        </motion.div>
      </motion.div>
    </div>
  )
}

// ── Hero ──────────────────────────────────────────────────────
function HeroStory({ onSignIn, isAuthed, weeklyViews }: { onSignIn: () => void; isAuthed: boolean; weeklyViews: number }) {
  const navigate = useNavigate()
  return (
    <section className="relative overflow-hidden" style={{ paddingTop: 64, paddingBottom: 80 }}>
      {/* Faint backdrop halo */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1400 800">
          <defs>
            <radialGradient id="hero-halo" cx="85%" cy="20%" r="45%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.10" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1400" height="800" fill="url(#hero-halo)" />
        </svg>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left — headline + CTA */}
          <div className="lg:col-span-7">
            <Reveal>
              <div className="flex items-center gap-2.5 mb-7">
                <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }}>
                  <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'var(--accent)', opacity: 0.5 }} />
                </span>
                <span className="font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: 'var(--muted)' }}>
                  Chapel Hill · @unc.edu only
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <h1
                className="font-display leading-[0.98] tracking-[-0.025em]"
                style={{ fontSize: 'clamp(52px, 8vw, 96px)', fontWeight: 400, color: 'var(--ink)' }}
              >
                A <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>better</em> home<br />
                for subleases.
              </h1>
            </Reveal>

            <Reveal delay={0.15}>
              <p className="mt-7 text-[17px] leading-[1.55] max-w-[540px]" style={{ color: 'var(--ink-2)' }}>
                Your friend needs a sublease. They're scrolling through the Snap story. Again.
                Purch is the place you send them instead — a real board, built for Tar Heels.
              </p>
            </Reveal>

            <Reveal delay={0.25}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Btn size="lg" onClick={() => navigate('/browse')} icon={<ArrowR />}>
                  Browse listings
                </Btn>
                <Btn size="lg" variant="outline" onClick={isAuthed ? () => navigate('/post') : onSignIn}>
                  Post yours — free
                </Btn>
              </div>
              <p className="mt-5 text-[12px] font-mono uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>
                Sign in with @unc.edu · no new password
              </p>
              {weeklyViews > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }}>
                    <span className="absolute inset-0 rounded-full animate-ping" style={{ background: '#22c55e', opacity: 0.5 }} />
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>
                    <AnimatedCounter value={weeklyViews} /> people visited this week
                  </span>
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'color-mix(in oklab, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
                  >
                    growing fast
                  </span>
                </div>
              )}
            </Reveal>
          </div>

          {/* Right — birdhouse vignette */}
          <div className="lg:col-span-5 relative hidden lg:block">
            <Reveal delay={0.2}>
              <HeroVignette />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── How It Works ──────────────────────────────────────────────
function HowItWorks() {
  const rows = [
    {
      n: '01',
      t: 'Verify with .edu',
      d: 'Get a verification code to your @unc.edu. No passwords, no phone scraping. Your real identity is tied to every listing and every message.',
      spec: ['OTP · magic code', 'No password', '<30s to activate'],
    },
    {
      n: '02',
      t: 'Map or list — browse either way',
      d: 'Filter by price, dates, beds, pets, furnished. Hover a card to light up its pin. Click a pin to see photos and the student hosting it.',
      spec: ['Real addresses', 'Distance from campus', 'Save & compare'],
    },
    {
      n: '03',
      t: 'Message inside Purch',
      d: 'Every conversation stays in one thread. Walkthroughs, terms, roommate questions. No stranger DMs, no Snap stories, no lost messages.',
      spec: ['In-app chat', 'Real-time replies', 'No numbers shared'],
    },
  ]
  return (
    <section className="px-6 py-28" style={{ background: 'var(--bg-2)' }}>
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div>
              <Eyebrow>How it works</Eyebrow>
              <h2
                className="font-display mt-3"
                style={{ fontSize: 'clamp(32px, 4.2vw, 56px)', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.02, color: 'var(--ink)' }}
              >
                Sign in. Browse the map.<br />Message the student.
              </h2>
            </div>
            <p className="text-[15.5px] leading-[1.6] md:self-end max-w-[520px]" style={{ color: 'var(--ink-2)' }}>
              Purch is built around three things students actually need from a sublease board: proof it's real,
              a way to see where it is, and a way to talk to whoever's renting it. Nothing else.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rows.map((r, i) => (
            <Reveal key={r.n} delay={i * 0.08}>
              <div className="rounded-2xl p-6 h-full flex flex-col" style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}>
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-[11px] tracking-[0.14em]" style={{ color: 'var(--muted)' }}>
                    STEP / {r.n}
                  </span>
                  <span
                    className="w-8 h-8 rounded-full grid place-items-center font-mono text-[11px]"
                    style={{ background: 'var(--bg-2)', color: 'var(--accent)', border: '1px solid var(--line)' }}
                  >
                    →
                  </span>
                </div>
                <h3 className="font-display text-[22px] leading-[1.2]" style={{ letterSpacing: '-0.01em', fontWeight: 400, color: 'var(--ink)' }}>
                  {r.t}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.55] flex-1" style={{ color: 'var(--ink-2)' }}>{r.d}</p>
                <ul className="mt-6 pt-5 space-y-1.5" style={{ borderTop: '1px solid var(--line)' }}>
                  {r.spec.map(s => (
                    <li key={s} className="font-mono text-[11px] flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                      <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Map Section ───────────────────────────────────────────────
type Pin = { id: string; x: number; y: number; price: number; hot: boolean; label: string }

function MapCanvas({
  pins,
  activePin,
  setActivePin,
  sweep,
  onOpen,
}: {
  pins: Pin[]
  activePin: string | null
  setActivePin: (id: string) => void
  sweep: number
  onOpen: () => void
}) {
  return (
    <div className="absolute inset-0">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 680" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="var(--map-street-fine)" strokeWidth="0.8" opacity="0.9" />
          </pattern>
          <pattern id="hero-grid-fine" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="var(--map-label)" opacity="0.35" />
          </pattern>
          <radialGradient id="hero-vignette" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.55" />
          </radialGradient>
          <linearGradient id="sweep-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
            <stop offset="80%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="1200" height="680" fill="var(--map-surface)" />
        <rect width="1200" height="680" fill="url(#hero-grid-fine)" />
        <rect width="1200" height="680" fill="url(#hero-grid)" />

        {/* Franklin Street */}
        <path d="M0 300 Q400 275 800 290 Q1000 300 1200 265" stroke="var(--map-street-hi)" strokeWidth="38" fill="none" opacity="0.9" />
        <path d="M0 300 Q400 275 800 290 Q1000 300 1200 265" stroke="var(--map-street)" strokeWidth="34" fill="none" />
        <path d="M0 300 Q400 275 800 290 Q1000 300 1200 265" stroke="var(--map-label)" strokeWidth="0.7" fill="none" opacity="0.5" strokeDasharray="4 6" />

        {/* Cross streets */}
        <path d="M260 0 L290 680" stroke="var(--map-street-hi)" strokeWidth="20" fill="none" opacity="0.9" />
        <path d="M260 0 L290 680" stroke="var(--map-street)" strokeWidth="16" fill="none" />
        <path d="M560 0 L580 680" stroke="var(--map-street-hi)" strokeWidth="24" fill="none" opacity="0.9" />
        <path d="M560 0 L580 680" stroke="var(--map-street)" strokeWidth="20" fill="none" />
        <path d="M840 80 L820 680" stroke="var(--map-street-hi)" strokeWidth="18" fill="none" opacity="0.9" />
        <path d="M840 80 L820 680" stroke="var(--map-street)" strokeWidth="14" fill="none" />

        {/* Minor streets */}
        <path d="M0 460 L1200 435" stroke="var(--map-street-fine)" strokeWidth="9" fill="none" />
        <path d="M0 120 Q600 110 1200 135" stroke="var(--map-street-fine)" strokeWidth="7" fill="none" />
        <path d="M140 0 L160 680" stroke="var(--map-street-fine)" strokeWidth="5" fill="none" />
        <path d="M1000 0 L980 680" stroke="var(--map-street-fine)" strokeWidth="5" fill="none" />

        {/* Campus blob */}
        <path d="M580 370 Q730 335 800 435 Q820 540 690 555 Q560 555 545 468 Q535 390 580 370 Z"
          fill="color-mix(in oklab, var(--accent) 10%, transparent)"
          stroke="color-mix(in oklab, var(--accent) 45%, transparent)"
          strokeWidth="1" strokeDasharray="6 8" />
        <text x="680" y="468" textAnchor="middle" fontSize="10" fill="var(--map-label)" letterSpacing="3">UNC · CAMPUS</text>

        {/* Carrboro cluster */}
        <circle cx="200" cy="485" r="70" fill="color-mix(in oklab, var(--accent) 4%, transparent)" stroke="var(--map-street)" strokeWidth="1" strokeDasharray="3 4" />
        <text x="200" y="490" textAnchor="middle" fontSize="9" fill="var(--map-label)" letterSpacing="2">CARRBORO</text>

        {/* Street labels */}
        <text x="100" y="290" fontSize="8" fill="var(--map-label)" letterSpacing="2">W FRANKLIN ST</text>
        <text x="860" y="285" fontSize="8" fill="var(--map-label)" letterSpacing="2">E FRANKLIN ST</text>

        {/* Sweep line */}
        <rect x={sweep * 1400 - 200} y="0" width="200" height="680" fill="url(#sweep-grad)" opacity="0.5" />

        {/* Vignette */}
        <rect width="1200" height="680" fill="url(#hero-vignette)" opacity="0.4" />
      </svg>

      {/* Pins */}
      {pins.map((p, i) => {
        const isActive = activePin === p.id
        return (
          <motion.button
            key={p.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.07, type: 'spring', stiffness: 280, damping: 18 }}
            onMouseEnter={() => setActivePin(p.id)}
            onClick={onOpen}
            className="absolute -translate-x-1/2 -translate-y-1/2 eased"
            style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: isActive ? 20 : 10 }}
            whileHover={{ scale: 1.08 }}
          >
            {p.hot && (
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: 'var(--accent)', opacity: 0.22, transform: 'scale(1.6)' }}
              />
            )}
            <div
              className="rounded-full font-mono tabnum shadow-lg eased flex items-center gap-1.5"
              style={{
                background: isActive ? 'var(--accent)' : p.hot ? 'var(--accent)' : 'var(--paper)',
                color: (isActive || p.hot) ? 'white' : 'var(--ink)',
                border: (isActive || p.hot) ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--line)',
                padding: '6px 11px',
                fontSize: 11.5,
                fontWeight: 500,
              }}
            >
              {p.hot && !isActive && <span className="w-1 h-1 rounded-full bg-white" />}
              ${p.price}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

function MapSection({ onOpen }: { onOpen: () => void }) {
  const [activePin, setActivePin] = useState<string | null>(null)
  const [sweep, setSweep] = useState(0)

  const pins: Pin[] = [
    { id: 'r1', x: 28, y: 46, price: 720, hot: true, label: 'Carrboro studio' },
    { id: 'r2', x: 46, y: 38, price: 875, hot: false, label: 'Franklin 2BR' },
    { id: 'r3', x: 58, y: 52, price: 1120, hot: true, label: 'Mill Creek 3BR' },
    { id: 'r4', x: 38, y: 62, price: 640, hot: false, label: 'N. Greensboro' },
    { id: 'r5', x: 68, y: 30, price: 1400, hot: false, label: 'Estes Park 4BR' },
    { id: 'r6', x: 22, y: 28, price: 925, hot: false, label: 'W. Rosemary' },
    { id: 'r7', x: 72, y: 66, price: 810, hot: false, label: 'S. Elliott' },
  ]

  // Cycle through pins
  useEffect(() => {
    const order = ['r1', 'r3', 'r5', 'r2', 'r4']
    let i = 0
    const t = setInterval(() => {
      setActivePin(order[i % order.length])
      i++
    }, 1800)
    return () => clearInterval(t)
  }, [])

  // Sweep animation
  useEffect(() => {
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      setSweep(((now - start) / 8000) % 1)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const activePinData = pins.find(x => x.id === activePin)

  return (
    <section className="relative px-6" style={{ paddingTop: 80, paddingBottom: 72 }}>
      <div className="max-w-[1280px] mx-auto">
        {/* Section intro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 items-end">
          <div className="lg:col-span-7">
            <Eyebrow>02 · The map</Eyebrow>
            <Reveal delay={0.05}>
              <h2
                className="font-display mt-4 leading-[1.02] tracking-[-0.025em]"
                style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 400, color: 'var(--ink)' }}
              >
                Every Chapel Hill sublease,{' '}
                <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>in one place.</em>
              </h2>
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={0.12}>
              <p className="text-[15px] leading-[1.55] max-w-[440px]" style={{ color: 'var(--ink-2)' }}>
                Scroll the neighborhood, not a feed. Every pin is a verified UNC student — message them inside the app, tour the place, and sign without leaving Purch.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-6">
                <Btn size="md" onClick={onOpen} icon={<ArrowR />}>Open the full map</Btn>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Map */}
        <Reveal delay={0.15}>
          <div
            className="relative rounded-3xl overflow-hidden map-glow"
            style={{ height: 'min(68vh, 620px)', background: 'var(--paper)' }}
          >
            <MapCanvas pins={pins} activePin={activePin} setActivePin={setActivePin} sweep={sweep} onOpen={onOpen} />

            {/* Floating command bar */}
            <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, ease }}
                className="pointer-events-auto rounded-2xl backdrop-blur-xl flex items-center gap-0 overflow-hidden"
                style={{
                  background: 'color-mix(in oklab, var(--paper) 82%, transparent)',
                  border: '1px solid var(--line)',
                  minWidth: 320,
                }}
              >
                <div className="flex items-center gap-2 pl-4 pr-3 py-3 flex-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ color: 'var(--muted)' }}>
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
                  </svg>
                  <span className="text-[13px]" style={{ color: 'var(--muted)' }}>Search Franklin, Carrboro, Mill Creek…</span>
                </div>
                <button
                  onClick={onOpen}
                  className="h-full px-4 font-mono text-[11px] tracking-[0.12em] uppercase eased"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  Search →
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5, ease }}
                className="pointer-events-auto hidden md:flex items-center gap-1 rounded-full backdrop-blur-xl px-1.5 py-1.5"
                style={{ background: 'color-mix(in oklab, var(--paper) 82%, transparent)', border: '1px solid var(--line)' }}
              >
                {[{ k: 'beds', v: 'Any' }, { k: 'dates', v: 'May – Aug' }, { k: 'price', v: '<$1200' }].map(f => (
                  <button key={f.k} className="px-3 py-1 rounded-full font-mono text-[11px] eased" style={{ color: 'var(--ink-2)' }}>
                    <span style={{ color: 'var(--muted)' }}>{f.k}:</span> {f.v}
                  </button>
                ))}
              </motion.div>
            </div>

            {/* Stats card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease }}
              className="absolute bottom-4 left-4 rounded-2xl backdrop-blur-xl p-4 min-w-[220px]"
              style={{ background: 'color-mix(in oklab, var(--paper) 85%, transparent)', border: '1px solid var(--line)' }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] mb-3" style={{ color: 'var(--muted)' }}>
                Chapel Hill · Summer 2026
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {[{ n: '47', l: 'active' }, { n: '$845', l: 'median' }, { n: '11', l: 'this week' }, { n: '96%', l: 'filled' }].map(s => (
                  <div key={s.l}>
                    <div className="font-display tabnum" style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{s.n}</div>
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Active pin preview */}
            <AnimatePresence mode="wait">
              {activePinData && (
                <motion.div
                  key={activePinData.id}
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.96 }}
                  transition={{ duration: 0.3, ease }}
                  className="absolute bottom-4 right-4 rounded-2xl backdrop-blur-xl overflow-hidden w-[260px]"
                  style={{ background: 'color-mix(in oklab, var(--paper) 90%, transparent)', border: '1px solid var(--line)' }}
                >
                  <Photo label={activePinData.label} tone={activePinData.hot ? 'dusk' : 'blue'} aspect="16/10" className="rounded-none" />
                  <div className="p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--muted)' }}>
                        pin · {activePinData.id}
                      </span>
                      <span className="font-display tabnum" style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>
                        ${activePinData.price}
                        <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>/mo</span>
                      </span>
                    </div>
                    <p className="text-[13px]" style={{ color: 'var(--ink)' }}>{activePinData.label}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ── Trust Block ───────────────────────────────────────────────
function TrustBlock() {
  const points = [
    {
      n: '01',
      t: 'Every post is a real Tar Heel',
      d: 'Verification code to your @unc.edu. Every listing is tied to a verified student identity. No bots, no off-campus randos.',
    },
    {
      n: '02',
      t: 'Every pin is a real address',
      d: "No 'DM for location.' The map shows where the place actually is before you spend an hour messaging back and forth.",
    },
    {
      n: '03',
      t: 'Every message stays put',
      d: "Conversations live inside Purch — so you're not searching Snap, texts, and three group chats for who said what.",
    },
  ]
  return (
    <section className="px-6 py-28" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-[900px] mb-20">
          <Reveal>
            <span className="font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: 'color-mix(in oklab, var(--bg) 50%, transparent)' }}>
              Built for Heels, by Heels
            </span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2
              className="font-display mt-5 tracking-[-0.025em] leading-[1.02]"
              style={{ fontSize: 'clamp(40px, 5.2vw, 68px)', fontWeight: 400 }}
            >
              Not a Snap story.<br />
              Not Marketplace.<br />
              <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>A real board.</em>
            </h2>
          </Reveal>
        </div>

        <div>
          {points.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.08}>
              <div
                className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-5 py-10"
                style={{
                  borderTop: '1px solid color-mix(in oklab, var(--bg) 14%, transparent)',
                  borderBottom: i === points.length - 1 ? '1px solid color-mix(in oklab, var(--bg) 14%, transparent)' : 'none',
                }}
              >
                <div className="md:col-span-1">
                  <span className="font-mono tabnum text-[12px] tracking-[0.14em]" style={{ color: 'color-mix(in oklab, var(--bg) 50%, transparent)' }}>
                    {p.n}
                  </span>
                </div>
                <div className="md:col-span-6">
                  <h3
                    className="font-display leading-[1.1] tracking-[-0.015em]"
                    style={{ fontSize: 'clamp(22px, 2.4vw, 32px)', fontWeight: 400 }}
                  >
                    {p.t}
                  </h3>
                </div>
                <div className="md:col-span-5">
                  <p className="text-[15px] leading-[1.6] max-w-[440px]" style={{ color: 'color-mix(in oklab, var(--bg) 70%, transparent)' }}>
                    {p.d}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Final CTA ─────────────────────────────────────────────────
function FinalCTA({ onSignIn, isAuthed }: { onSignIn: () => void; isAuthed: boolean }) {
  const navigate = useNavigate()
  return (
    <section className="px-6 py-28">
      <div className="max-w-[1200px] mx-auto text-center">
        <Reveal>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            <span className="font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: 'var(--muted)' }}>
              Open now · @unc.edu only
            </span>
          </div>
          <h2
            className="font-display tracking-[-0.03em] leading-[0.98] max-w-[900px] mx-auto"
            style={{ fontSize: 'clamp(48px, 7vw, 100px)', fontWeight: 400, color: 'var(--ink)' }}
          >
            Your next place<br />
            <span style={{ color: 'var(--accent)' }}>is on the map.</span>
          </h2>
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Btn size="lg" onClick={() => navigate('/browse')} icon={<ArrowR />}>
              Open the map
            </Btn>
            <Btn size="lg" variant="outline" onClick={isAuthed ? () => navigate('/post') : onSignIn}>
              Post a sublease
            </Btn>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="px-6 py-10" style={{ borderTop: '1px solid var(--line)' }}>
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px]" style={{ color: 'var(--muted)' }}>
        <PurchLogo size={18} />
        <span className="font-mono uppercase tracking-[0.14em]">The Chapel Hill sublease board · made in 27514</span>
        <span className="font-mono">© 2026</span>
      </div>
    </footer>
  )
}

// ── Main Landing export ───────────────────────────────────────
export default function Landing() {
  const { isAuthed } = useAuth()
  const navigate = useNavigate()
  const [showSignIn, setShowSignIn] = useState(false)
  const [weeklyViews, setWeeklyViews] = useState(0)
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Insert view and fetch count in parallel
    supabase.from('page_views').insert({}).then(() => {})
    supabase
      .from('page_views')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo)
      .then(({ count }) => {
        if (count != null) setWeeklyViews(count)
      })
  }, [])

  function handleSignIn() {
    setShowSignIn(true)
  }

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      <Navbar />
      <AnimatePresence>
        {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      </AnimatePresence>

      <HeroStory onSignIn={handleSignIn} isAuthed={isAuthed} weeklyViews={weeklyViews} />
      <HowItWorks />
      <MapSection onOpen={() => navigate('/browse')} />
      <TrustBlock />
      <FinalCTA onSignIn={handleSignIn} isAuthed={isAuthed} />
      <Footer />
    </div>
  )
}
