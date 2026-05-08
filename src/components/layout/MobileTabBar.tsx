import { Link, useLocation } from 'react-router-dom'
import { useUnreadCount } from '../../hooks/useUnreadCount'

const tabs = [
  {
    to: '/browse',
    label: 'Browse',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/messages',
    label: 'Messages',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    to: '/post',
    label: 'Post',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export function MobileTabBar() {
  const location = useLocation()
  const unreadCount = useUnreadCount()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
      style={{
        height: 64,
        background: 'color-mix(in oklab, var(--bg) 92%, transparent)',
        borderTop: '1px solid var(--line)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map(({ to, label, icon }) => {
        const active = location.pathname === to || (to === '/browse' && location.pathname === '/')
        return (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-[3px] px-4 py-1 relative"
            style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
          >
            <div className="relative">
              {icon}
              {label === 'Messages' && unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1.5 text-white rounded-full flex items-center justify-center"
                  style={{
                    background: 'var(--accent)',
                    fontSize: 9,
                    fontWeight: 700,
                    minWidth: 14,
                    height: 14,
                    padding: '0 3px',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
