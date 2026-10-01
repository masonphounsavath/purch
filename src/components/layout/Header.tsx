import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useUnreadCount } from '../../hooks/useUnreadCount'
import { SignInModal } from '../auth/SignInModal'
import { cn } from '../../lib/utils'
import { container } from '../ui/styles'

const navLinks = [
  { to: '/browse', label: 'Browse', authOnly: false },
  { to: '/post', label: 'Post', authOnly: true },
  { to: '/messages', label: 'Messages', authOnly: true },
]

const navItem = 'px-3.5 py-2.5 rounded-full hover:bg-white/10 transition-colors'
const pillCta = 'px-[18px] py-[11px] rounded-full bg-brand-sky text-brand-navy hover:brightness-105 transition'

export function Header() {
  const { isAuthed } = useAuth()
  const unreadCount = useUnreadCount()
  const { pathname } = useLocation()
  const [showSignIn, setShowSignIn] = useState(false)
  const openSignIn = () => setShowSignIn(true)

  return (
    <>
      <header className="bg-brand-navy text-white border-b border-[#16324F] font-figtree">
        <div className={cn(container, 'h-[72px] flex items-center justify-between')}>
          <div className="flex items-center gap-10">
            <Link to="/" aria-label="Purch home" className="flex items-center">
              <img src="/brand/purch_exact_reference.svg" alt="purch" className="h-10 sm:h-11 w-auto block" />
            </Link>
            <nav className="hidden md:flex gap-1.5 text-[15px] font-semibold">
              {navLinks.map(({ to, label, authOnly }) => {
                const active = pathname === to || pathname.startsWith(`${to}/`)
                const content = (
                  <span className="flex items-center gap-1.5">
                    {label}
                    {label === 'Messages' && unreadCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-brand-sky text-brand-navy text-[11px] font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </span>
                )
                // Signed-out visitors get the sign-in modal instead of a bounce off ProtectedRoute
                return authOnly && !isAuthed ? (
                  <button key={to} type="button" onClick={openSignIn} className={navItem}>{content}</button>
                ) : (
                  <Link key={to} to={to} aria-current={active ? 'page' : undefined} className={cn(navItem, active && 'bg-white/10')}>
                    {content}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2 text-[15px] font-semibold">
            {isAuthed ? (
              <>
                <Link
                  to="/profile"
                  aria-current={pathname === '/profile' ? 'page' : undefined}
                  className={cn('px-3.5 py-2.5 hover:text-brand-sky transition-colors', pathname === '/profile' && 'text-brand-sky')}
                >
                  Profile
                </Link>
                <Link to="/post" className={pillCta}>Post your place</Link>
              </>
            ) : (
              <>
                <button type="button" onClick={openSignIn} className="px-3.5 py-2.5 hover:text-brand-sky transition-colors">Log in</button>
                <button type="button" onClick={openSignIn} className={pillCta}>Sign up</button>
              </>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      </AnimatePresence>
    </>
  )
}
