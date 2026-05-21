import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUnreadCount } from '../../hooks/useUnreadCount'

const tabs = [
  {
    to: '/browse',
    label: 'Browse',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
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
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    to: '/post',
    label: 'Post',
    isAction: true,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
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
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map(({ to, label, icon, isAction }) => {
        const active = location.pathname === to || (to === '/browse' && location.pathname === '/')

        // Post — prominent action button
        if (isAction) {
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-[3px]"
            >
              <motion.div
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex items-center justify-center rounded-2xl"
                style={{
                  width: 44,
                  height: 44,
                  background: active ? 'var(--ink)' : 'var(--accent)',
                  color: 'white',
                  boxShadow: '0 4px 16px color-mix(in oklab, var(--accent) 40%, transparent)',
                }}
              >
                {icon}
              </motion.div>
              <span
                className="font-label uppercase tracking-[0.08em]"
                style={{ fontSize: 9, color: active ? 'var(--ink)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}
              >
                {label}
              </span>
            </Link>
          )
        }

        // Regular tabs
        return (
          <Link
            key={to}
            to={to}
            className="relative flex flex-col items-center gap-[3px] px-4 py-1"
          >
            {active && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 rounded-2xl"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <div className="relative z-10 relative">
              <div style={{ color: active ? 'var(--ink)' : 'var(--muted)' }}>
                {icon}
              </div>
              {label === 'Messages' && unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1.5 flex items-center justify-center rounded-full text-white"
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
            <span
              className="relative z-10 font-label uppercase tracking-[0.08em]"
              style={{ fontSize: 9, color: active ? 'var(--ink)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
