import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

const stats = [
  { n: '2026', l: 'founded' },
  { n: '@unc.edu', l: 'access only' },
  { n: '100%', l: 'free to use' },
  { n: '27514', l: 'zip code' },
]

const values = [
  {
    title: 'Verified community',
    body: 'Every person on Purch signed in with a @unc.edu address. No randos, no bots, no off-campus listings buried in the feed. Just Tar Heels helping Tar Heels.',
  },
  {
    title: 'Real locations',
    body: "Every listing is pinned to a real address on the map. No more 'DM for location' — you can see exactly where a place is before you message anyone.",
  },
  {
    title: 'Built in the open',
    body: "Purch is a student project, not a startup. There's no growth team or ad revenue. If something's broken or confusing, email us and a real person will fix it.",
  },
]

export default function About() {
  const navigate = useNavigate()

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="px-6 py-20 md:py-28">
          <div className="max-w-[800px] mx-auto text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] mb-5" style={{ color: 'var(--muted)' }}>
              About Purch
            </p>
            <h1
              className="font-display tracking-[-0.025em] leading-[1.02]"
              style={{ fontSize: 'clamp(42px, 6vw, 72px)', fontWeight: 400, color: 'var(--ink)' }}
            >
              The sublease board Chapel Hill{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>actually needed.</em>
            </h1>
            <p className="mt-7 text-[16px] leading-[1.65] max-w-[580px] mx-auto" style={{ color: 'var(--ink-2)' }}>
              Purch started because finding a summer sublease at UNC was embarrassing — a Snap story, a couple of Facebook groups, and a lot of unanswered DMs. We built the thing that should have existed.
            </p>
          </div>
        </section>

        {/* Stats bar */}
        <section style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          <div className="max-w-[1280px] mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(s => (
              <div key={s.l} className="text-center">
                <div
                  className="font-display tabnum"
                  style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)' }}
                >
                  {s.n}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] mt-1" style={{ color: 'var(--muted)' }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="px-6 py-20">
          <div className="max-w-[1280px] mx-auto">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] mb-12" style={{ color: 'var(--muted)' }}>
              What we stand for
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {values.map((v, i) => (
                <div
                  key={v.title}
                  className="rounded-2xl p-7"
                  style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}
                >
                  <span className="font-mono text-[11px] tracking-[0.14em]" style={{ color: 'var(--muted)' }}>
                    0{i + 1}
                  </span>
                  <h3
                    className="font-display mt-4 mb-3"
                    style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--ink)' }}
                  >
                    {v.title}
                  </h3>
                  <p className="text-[14px] leading-[1.65]" style={{ color: 'var(--ink-2)' }}>
                    {v.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-24">
          <div className="max-w-[680px] mx-auto text-center">
            <div
              className="rounded-2xl p-10"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              <h2
                className="font-display tracking-[-0.02em] leading-[1.05]"
                style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400 }}
              >
                Built by Tar Heels,<br />for Tar Heels.
              </h2>
              <p className="mt-4 text-[14px] leading-[1.6]" style={{ color: 'color-mix(in oklab, var(--bg) 65%, transparent)' }}>
                Got feedback, a bug report, or just want to say hey? We'd love to hear from you.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => navigate('/browse')}
                  className="rounded-full px-5 py-2.5 text-[13.5px] font-medium eased"
                  style={{ background: 'var(--bg)', color: 'var(--ink)' }}
                >
                  Browse listings
                </button>
                <button
                  onClick={() => navigate('/contact')}
                  className="rounded-full px-5 py-2.5 text-[13.5px] font-medium eased"
                  style={{ background: 'transparent', color: 'var(--bg)', border: '1px solid color-mix(in oklab, var(--bg) 30%, transparent)' }}
                >
                  Get in touch
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
