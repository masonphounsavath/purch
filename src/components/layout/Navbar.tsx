import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { SignInModal } from '../auth/SignInModal'

export function Navbar() {
  const { isAuthed, user } = useAuth()
  const [showSignIn, setShowSignIn] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-unc-navy tracking-tight">
            Subly
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/browse" className="text-sm text-slate-500 hover:text-unc-navy transition-colors font-medium">
              Browse
            </Link>
            {isAuthed && (
              <Link to="/post" className="text-sm text-slate-500 hover:text-unc-navy transition-colors font-medium">
                Post a listing
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAuthed ? (
              <>
                <span className="text-xs text-slate-400 hidden sm:block">{user?.email}</span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-unc-navy transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowSignIn(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-unc-navy text-white px-4 py-2 rounded-lg hover:bg-[#1c3a6b] transition-colors"
              >
                Get started <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
    </>
  )
}
