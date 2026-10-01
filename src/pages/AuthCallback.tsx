import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/browse', { replace: true })
      } else if (event === 'SIGNED_OUT' || !session) {
        navigate('/', { replace: true })
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-figtree">
      <div className="text-center">
        <div className="w-8 h-8 border-[3px] border-brand-sky border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-brand-muted text-[15px] font-medium">Signing you in...</p>
      </div>
    </div>
  )
}
