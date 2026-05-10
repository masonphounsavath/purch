import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

const reasons = [
  { icon: '🐛', label: 'Bug report', body: 'Something broken? Tell us exactly what happened.' },
  { icon: '💡', label: 'Feedback', body: "Feature idea or something we could do better — we're all ears." },
  { icon: '🗑️', label: 'Data request', body: 'Want your data deleted or exported? Just ask.' },
  { icon: '📋', label: 'Listing issue', body: 'See a fraudulent or misleading listing? Flag it here.' },
]

export default function Contact() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="flex-1 px-6 py-20">
        <div className="max-w-[680px] mx-auto">
          {/* Header */}
          <div className="mb-14 text-center">
            <div className="mb-5 grid place-items-center">
              <div
                className="w-12 h-12 rounded-2xl grid place-items-center"
                style={{ background: 'color-mix(in oklab, var(--accent) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--accent) 25%, transparent)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
            </div>
            <h1
              className="font-display tracking-[-0.025em]"
              style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 400, color: 'var(--ink)' }}
            >
              Get in touch
            </h1>
            <p className="mt-3 text-[15px] max-w-[420px] mx-auto" style={{ color: 'var(--muted)' }}>
              Purch is a small team. Email us directly and a real person will reply.
            </p>
          </div>

          {/* Email CTA */}
          <div
            className="rounded-2xl p-8 md:p-10 mb-8 text-center"
            style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] mb-4" style={{ color: 'var(--muted)' }}>
              Primary contact
            </p>
            <a
              href="mailto:mason@purchit.org"
              className="font-display eased"
              style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 400, letterSpacing: '-0.015em', color: 'var(--accent)', textDecoration: 'none' }}
            >
              mason@purchit.org
            </a>
            <p className="mt-4 text-[13.5px] leading-[1.6]" style={{ color: 'var(--ink-2)' }}>
              We aim to respond within 48 hours. If you're a UNC student with an urgent listing issue, mention that in the subject line.
            </p>
          </div>

          {/* Reason grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reasons.map(r => (
              <a
                key={r.label}
                href={`mailto:mason@purchit.org?subject=${encodeURIComponent(r.label)}`}
                className="rounded-xl p-5 eased group"
                style={{ background: 'var(--paper)', border: '1px solid var(--line)', textDecoration: 'none', display: 'block' }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-[20px] mt-0.5 leading-none">{r.icon}</span>
                  <div>
                    <p className="text-[13.5px] font-medium mb-1" style={{ color: 'var(--ink)' }}>
                      {r.label}
                    </p>
                    <p className="text-[13px]" style={{ color: 'var(--ink-2)' }}>
                      {r.body}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.12em]" style={{ color: 'var(--accent)' }}>
                  Email us
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            ))}
          </div>

          {/* Note */}
          <p className="mt-8 text-center text-[12.5px] font-mono" style={{ color: 'var(--muted)' }}>
            Chapel Hill, NC 27514 · made by Tar Heels
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
