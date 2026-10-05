import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useUnreadCount } from '../../hooks/useUnreadCount'
import { SignInModal } from '../auth/SignInModal'
import { cn } from '../../lib/utils'

const tabs = [
  {
    to: '/browse',
    label: 'Browse',
    authOnly: false,
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
    authOnly: true,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    to: '/post',
    label: 'Post',
    authOnly: true,
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
    // Signed out, this slot becomes "Log in" — same as the desktop Header
    signedOutLabel: 'Log in',
    authOnly: true,
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
  const { isAuthed } = useAuth()
  const [showSignIn, setShowSignIn] = useState(false)
  const openSignIn = () => setShowSignIn(true)

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 flex items-center justify-around bg-brand-navy border-t border-[#16324F] font-figtree"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {tabs.map(({ to, label: authedLabel, signedOutLabel, icon, isAction, authOnly }) => {
          const active = location.pathname === to || (to === '/browse' && location.pathname === '/')
          // Signed-out visitors get the sign-in modal instead of a bounce off ProtectedRoute
          const gated = authOnly && !isAuthed
          const label = gated && signedOutLabel ? signedOutLabel : authedLabel
          const renderTab = (className: string, children: React.ReactNode) =>
            gated ? (
              <button key={to} type="button" onClick={openSignIn} className={className}>{children}</button>
            ) : (
              <Link key={to} to={to} aria-current={active ? 'page' : undefined} className={className}>{children}</Link>
            )

          // Post — prominent action button
          if (isAction) {
            return renderTab(
              'flex flex-col items-center gap-[3px]',
              <>
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={cn(
                    'w-11 h-11 flex items-center justify-center rounded-[12px] transition-colors',
                    active ? 'bg-white text-brand-navy' : 'bg-brand-sky text-brand-navy',
                  )}
                >
                  {icon}
                </motion.div>
                <span className={cn('text-[10px] font-semibold', active ? 'text-white' : 'text-brand-subtle')}>
                  {label}
                </span>
              </>,
            )
          }

          // Regular tabs
          return renderTab(
            'relative flex flex-col items-center gap-[3px] px-4 py-1',
            <>
              {active && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-[12px] bg-white/10"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <div className="relative z-10">
                <div className={active ? 'text-brand-sky' : 'text-brand-subtle'}>
                  {icon}
                </div>
                {label === 'Messages' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-[3px] flex items-center justify-center rounded-full bg-brand-sky text-brand-navy text-[9px] font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={cn('relative z-10 text-[10px] font-semibold', active ? 'text-white' : 'text-brand-subtle')}>
                {label}
              </span>
            </>,
          )
        })}
      </nav>

      <AnimatePresence>
        {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      </AnimatePresence>
    </>
  )
}
