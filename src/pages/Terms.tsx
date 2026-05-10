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

export default function Terms() {
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
            </div>
            <h1
              className="font-display tracking-[-0.025em]"
              style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 400, color: 'var(--ink)' }}
            >
              Terms of Use
            </h1>
            <p className="mt-3 text-[15px]" style={{ color: 'var(--muted)' }}>
              The rules that keep Purch fair and trustworthy for everyone.
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
            <Section title="Who can use Purch">
              <p>
                Purch is exclusively for current UNC Chapel Hill students and affiliates with an active <strong>@unc.edu</strong> email address. By signing in, you confirm that the email you use belongs to you and is associated with your enrollment.
              </p>
            </Section>

            <div style={{ borderTop: '1px solid var(--line)' }} />

            <Section title="Listing rules">
              <p>
                Every listing must represent a real, available sublease in the Chapel Hill / Carrboro area. You may only post a listing for a unit you have the right to sublease. Fraudulent, duplicate, or misleading listings will be removed and your account suspended.
              </p>
              <p>
                Pricing must reflect what you are actually charging. Do not mark a place as available if it's already been filled.
              </p>
            </Section>

            <div style={{ borderTop: '1px solid var(--line)' }} />

            <Section title="Purch is not a party to transactions">
              <p>
                Purch provides a platform for UNC students to find and connect with subletters. We do not verify individual listings, guarantee availability, or take responsibility for agreements made between users. All sublease arrangements are between you and the other party.
              </p>
              <p>
                Always exercise common sense: tour before you commit, use a written agreement, and never send money before you've confirmed the listing is legitimate.
              </p>
            </Section>

            <div style={{ borderTop: '1px solid var(--line)' }} />

            <Section title="Acceptable use">
              <p>
                Don't use Purch to harass other users, post spam, or scrape listings for use elsewhere. Messages sent through the in-app thread must be related to the listing at hand. We reserve the right to remove content or accounts that violate this policy.
              </p>
            </Section>

            <div style={{ borderTop: '1px solid var(--line)' }} />

            <Section title="Intellectual property">
              <p>
                By posting photos or content on Purch, you grant us a limited license to display that content on the platform. You retain ownership of everything you post. We will never sell or license your content to third parties.
              </p>
            </Section>

            <div style={{ borderTop: '1px solid var(--line)' }} />

            <Section title="Subletting & lease policies">
              <p>
                Many apartments and landlords have specific policies regarding subletting — including restrictions or outright prohibitions. <strong>It is your responsibility to review and comply with your own lease agreement and your landlord's policies before listing or taking over a sublet.</strong>
              </p>
              <p>
                Purch does not review, enforce, or intervene in the terms between you and your landlord. By using the platform, you acknowledge that any subletting arrangement you enter into is solely your own, and that Purch bears no responsibility for lease violations or disputes that may arise.
              </p>
            </Section>

            <div style={{ borderTop: '1px solid var(--line)' }} />

            <Section title="Changes to these terms">
              <p>
                We may update these terms as the platform evolves. If we make a material change, we'll let you know via the email on file. Continued use of Purch after an update means you accept the revised terms.
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
                Questions about these terms? Reach us at{' '}
                <a href="mailto:mason@purchit.org" className="underline eased" style={{ color: 'var(--ink-2)' }}>
                  mason@purchit.org
                </a>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
