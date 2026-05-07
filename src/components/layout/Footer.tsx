import { Link } from 'react-router-dom'
import { PurchLogo } from '../ui/PurchLogo'

const footerLinks = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
]

export function Footer() {
  return (
    <footer className="px-6 py-10" style={{ borderTop: '1px solid var(--line)' }}>
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center">
          <PurchLogo size={18} />
        </Link>

        <div className="flex items-center gap-5">
          {footerLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="font-mono text-[11px] uppercase tracking-[0.12em] eased"
              style={{ color: 'var(--muted)' }}
            >
              {label}
            </Link>
          ))}
        </div>

        <span className="font-mono text-[12px]" style={{ color: 'var(--muted)' }}>
          © 2026 Purch
        </span>
      </div>
    </footer>
  )
}
