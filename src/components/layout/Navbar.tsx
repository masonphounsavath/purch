import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useUnreadCount } from '../../hooks/useUnreadCount'
import { useDarkMode } from '../../hooks/useDarkMode'
import { supabase } from '../../lib/supabase'
import { SignInModal } from '../auth/SignInModal'
import { PurchLogo } from '../ui/PurchLogo'

const navLinks = [
  { to: '/browse', label: 'Browse' },
  { to: '/post', label: 'Post' },
  { to: '/messages', label: 'Messages' },
]

export function Navbar() {
  const { isAuthed, user } = useAuth()
  const unreadCount = useUnreadCount()
  const { isDark, toggle: toggleDark } = useDarkMode()
  const [showSignIn, setShowSignIn] = useState(false)
  const location = useLocation()

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <>
      <nav
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{
          background: 'color-mix(in oklab, var(--bg) 82%, transparent)',
          borderBottom: '1px solid var(--line)',
          height: 56,
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <PurchLogo size={22} />
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map(({ to, label }) => {
              if ((to === '/post' || to === '/messages') && !isAuthed) return null
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className="relative text-[13px] eased"
                  style={{
                    color: active ? 'var(--ink)' : 'var(--muted)',
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {label}
                  {label === 'Messages' && unreadCount > 0 && (
                    <span
                      className="ml-1.5 inline-flex items-center justify-center text-[10px] rounded-full px-1.5 py-0.5 text-white"
                      style={{ background: 'var(--accent)' }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-0 right-0 -bottom-[19px] h-[2px]"
                      style={{ background: 'var(--ink)' }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 rounded-full grid place-items-center eased"
              style={{
                color: 'var(--ink-2)',
                border: '1px solid var(--line)',
                background: 'transparent',
              }}
            >
              {isDark ? (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {isAuthed ? (
              <>
                <Link
                  to="/profile"
                  className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-medium text-white eased"
                  style={{ background: 'var(--accent)' }}
                  title={user?.email}
                >
                  {user?.email?.slice(0, 2).toUpperCase()}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-[12px] px-3.5 py-1.5 rounded-full eased hidden sm:block"
                  style={{ color: 'var(--muted)', border: '1px solid var(--line)', background: 'transparent' }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowSignIn(true)}
                className="text-[13px] px-3.5 py-1.5 rounded-full eased font-medium"
                style={{ background: 'var(--ink)', color: 'var(--bg)' }}
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
    </>
  )
}
