import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="font-display mb-3"
        style={{ fontSize: 20, fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--ink)' }}
      >
        {title}
      </h2>
      <div className="text-[14.5px] leading-[1.7] space-y-3" style={{ color: 'var(--ink-2)' }}>
        {children}
      </div>
    </div>
  )
}

export default function Privacy() {
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
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>
            <h1
              className="font-display tracking-[-0.025em]"
              style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 400, color: 'var(--ink)' }}
            >
              Privacy Policy
            </h1>
            <p className="mt-3 text-[15px]" style={{ color: 'var(--muted)' }}>
              Your privacy and data security are our top priorities.
            </p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>
              Last updated · May 2026
            </p>
          </div>

          {/* Content card */}
          <div
            className="rounded-2xl p-8 md:p-10 space-y-8"
            style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}
          >
            <Section title="What we collect">
              <p>
                When you sign in, we receive your <strong>@unc.edu email address</strong> from your institution's authentication provider. That's the only personal identifier we store. No password, no phone number, no payment info.
              </p>
              <p>
                We also store content you create — listing details, photos, and messages sent through the app — as well as anonymous page view counts to understand how the platform is being used.
              </p>
            </Section>

            <div style={{ borderTop: '1px solid var(--line)' }} />

            <Section title="How we use it">
              <p>
                Your information is used solely to operate Purch — to display your listings, route your messages, and keep the board trustworthy. We do not sell, rent, or share your data with third parties for marketing.
              </p>
              <p>
                Your email is visible to Purch but is never displayed publicly on the platform. Other users see your listing and can message you through the in-app thread — your address never leaves our system.
              </p>
            </Section>

            <div style={{ borderTop: '1px solid var(--line)' }} />

            <Section title="Third-party services">
              <p>
                Purch runs on <strong>Supabase</strong> for authentication and data storage, and uses <strong>Mapbox</strong> for map rendering. Both services operate under their own privacy policies and comply with standard data protection practices. No third party receives your email address from us.
              </p>
            </Section>

            <div style={{ borderTop: '1px solid var(--line)' }} />

            <Section title="Data security">
              <p>
                All data is encrypted in transit (TLS) and at rest. Access to the database is strictly controlled. We follow industry best practices and regularly review our security posture.
              </p>
            </Section>

            <div style={{ borderTop: '1px solid var(--line)' }} />

            <Section title="Your rights">
              <p>
                You can request access to, correction of, or deletion of your personal data at any time. To close your account and remove your data, contact us and we'll handle it promptly.
              </p>
            </Section>

            {/* Contact note */}
            <div
              className="flex items-start gap-3 rounded-xl px-5 py-4 mt-2"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" className="mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
                Questions about your data? Email us at{' '}
                <a href="mailto:hello@purch.app" className="underline eased" style={{ color: 'var(--ink-2)' }}>
                  hello@purch.app
                </a>{' '}
                and we'll respond within 48 hours.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
