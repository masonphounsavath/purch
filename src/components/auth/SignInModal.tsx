import { useState } from 'react'
import { X, ArrowRight, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'

interface Props {
  onClose: () => void
}

type Step = 'email' | 'code'

export function SignInModal({ onClose }: Props) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.endsWith('@unc.edu')) {
      setError('You need a @unc.edu email to use Purch.')
      return
    }

    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      setStep('code')
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })
    setLoading(false)

    if (verifyError) {
      setError('Invalid or expired code. Try again.')
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Modal */}
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'email' ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-unc-navy mb-2">Sign in to Purch</h2>
              <p className="text-slate-body text-sm">
                Enter your UNC email and we'll send you a 6-digit code — no password needed.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-unc-navy mb-1.5">
                  UNC email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="onyen@unc.edu"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-unc-navy placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-unc-blue/40 focus:border-unc-blue transition-all text-sm"
                />
                {error && (
                  <p className="text-red-500 text-xs mt-1.5">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full inline-flex items-center justify-center gap-2 bg-unc-navy text-white font-semibold py-3 rounded-xl hover:bg-[#1c3a6b] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Send code <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="text-xs text-slate-400 text-center mt-5">
              Only @unc.edu / @ad.unc.edu emails are accepted.
            </p>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-14 h-14 bg-unc-blue/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-7 h-7 text-unc-blue" />
              </div>
              <h2 className="text-2xl font-bold text-unc-navy mb-2">Check your inbox</h2>
              <p className="text-slate-body text-sm">
                We sent a 6-digit code to <span className="font-semibold text-unc-navy">{email}</span>
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-unc-navy mb-1.5">
                  Verification code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  required
                  autoFocus
                  inputMode="numeric"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-unc-navy placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-unc-blue/40 focus:border-unc-blue transition-all text-sm tracking-widest"
                />
                {error && (
                  <p className="text-red-500 text-xs mt-1.5">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full inline-flex items-center justify-center gap-2 bg-unc-navy text-white font-semibold py-3 rounded-xl hover:bg-[#1c3a6b] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Verify <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <button
              onClick={() => { setStep('email'); setCode(''); setError('') }}
              className="w-full text-xs text-slate-400 hover:text-slate-600 mt-4 transition-colors"
            >
              Use a different email
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
