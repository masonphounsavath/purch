import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { PurchLogo } from './ui/PurchLogo'
import { Eyebrow } from './ui/Eyebrow'
import { button, field } from './ui/styles'

interface Props {
  userId: string
  onComplete: () => void
}

export function NotificationEmailGate({ userId, onComplete }: Props) {
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const trimmed = email.trim().toLowerCase()

    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Enter a valid email address.')
      return
    }
    if (trimmed.endsWith('.edu')) {
      setError('Use a personal email (Gmail, iCloud, etc.) — .edu inboxes often block notifications.')
      return
    }

    setSaving(true)
    const { error: err } = await supabase
      .from('profiles')
      .update({ notification_email: trimmed })
      .eq('id', userId)

    if (err) {
      setError('Something went wrong. Try again.')
      setSaving(false)
      return
    }
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-white text-brand-navy font-figtree">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-12">
          <PurchLogo size={36} />
        </div>

        <Eyebrow>ALMOST DONE</Eyebrow>
        <h1 className="font-outfit text-[clamp(32px,7vw,44px)] leading-[1.02] font-extrabold tracking-[-0.03em] mt-3 mb-3">
          One more thing.
        </h1>

        <p className="text-brand-muted text-base leading-relaxed mb-8">
          UNC email filters block most notifications. Add a personal email — Gmail, iCloud, anything but .edu — so you never miss a message about your sublease.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="yourname@gmail.com"
            autoFocus
            className={field}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={saving || !email.trim()} className={button('primary', 'lg', 'w-full')}>
            {saving ? 'Saving…' : 'Save and continue →'}
          </button>
        </form>

        <p className="mt-5 text-brand-muted text-xs">
          Only used for Purch message notifications. Never shared.
        </p>
      </div>
    </div>
  )
}
