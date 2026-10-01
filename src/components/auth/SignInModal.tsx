import { useState } from 'react'
import { X, ArrowRight, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { button, ease, field, fieldLabel, fieldError } from '../ui/styles'

type Step = 'email' | 'code'

interface Props {
  onClose: () => void
  // Lets a page send the code itself and open the modal straight at the code step
  initialEmail?: string
  initialStep?: Step
}

export function SignInModal({ onClose, initialEmail = '', initialStep = 'email' }: Props) {
  const [step, setStep] = useState<Step>(initialStep)
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.endsWith('@unc.edu') && !email.endsWith('@ad.unc.edu')) {
      setError('You need a @unc.edu or @ad.unc.edu email to use Purch.')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-figtree text-brand-navy">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Modal */}
      <motion.div
        className="relative bg-white rounded-[20px] shadow-[0_24px_64px_rgba(5,30,55,0.28)] w-full max-w-md p-8"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-brand-muted hover:bg-brand-mist hover:text-brand-navy transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'email' ? (
          <>
            <div className="mb-6">
              <h2 className="font-outfit text-[28px] leading-tight font-extrabold tracking-[-0.03em] mb-2">Sign in to Purch</h2>
              <p className="text-brand-muted text-[15px] leading-relaxed">
                Enter your UNC email and we'll send you an 8-digit code — no password needed.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className={fieldLabel}>
                  UNC email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="onyen@unc.edu"
                  required
                  autoFocus
                  className={field}
                />
                {error && (
                  <p className={fieldError}>{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className={button('primary', 'lg', 'w-full')}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Send code <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="text-xs text-brand-muted text-center mt-5">
              Only @unc.edu / @ad.unc.edu emails are accepted.
            </p>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-14 h-14 bg-brand-mist rounded-full flex items-center justify-center mb-4">
                <Mail className="w-7 h-7 text-brand-sky-ink" />
              </div>
              <h2 className="font-outfit text-[28px] leading-tight font-extrabold tracking-[-0.03em] mb-2">Check your inbox</h2>
              <p className="text-brand-muted text-[15px] leading-relaxed">
                We sent an 8-digit code to <span className="font-semibold text-brand-navy">{email}</span>
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className={fieldLabel}>
                  Verification code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="12345678"
                  required
                  autoFocus
                  inputMode="numeric"
                  className={`${field} tracking-widest`}
                />
                {error && (
                  <p className={fieldError}>{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 8}
                className={button('primary', 'lg', 'w-full')}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Verify <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <button
              onClick={() => { setStep('email'); setCode(''); setError('') }}
              className="w-full text-sm font-medium text-brand-muted hover:text-brand-navy mt-4 transition-colors"
            >
              Use a different email
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
