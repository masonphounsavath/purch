import { useState } from 'react'
import { supabase } from '../lib/supabase'

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '48px' }}>
          <img src="/logo-icon.png" alt="Purch" style={{ width: '28px', height: '28px' }} />
          <span style={{ fontFamily: 'var(--font-display, Fraunces)', fontSize: '18px', fontWeight: 600, color: 'var(--ink)' }}>
            purch
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: 'var(--font-display, Fraunces)',
            fontSize: 'clamp(28px, 6vw, 40px)',
            fontWeight: 700,
            color: 'var(--ink)',
            lineHeight: 1.15,
            marginBottom: '12px',
          }}
        >
          One more thing.
        </h1>

        <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
          UNC email filters block most notifications. Add a personal email — Gmail, iCloud, anything but .edu — so you never miss a message about your sublease.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="yourname@gmail.com"
            autoFocus
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1.5px solid var(--line)',
              background: 'var(--paper)',
              color: 'var(--ink)',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--ink)')}
            onBlur={e => (e.target.style.borderColor = 'var(--line)')}
          />

          {error && (
            <p style={{ color: '#c0392b', fontSize: '13px', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={saving || !email.trim()}
            style={{
              padding: '14px 24px',
              borderRadius: '999px',
              background: 'var(--ink)',
              color: 'var(--bg)',
              fontSize: '15px',
              fontWeight: 600,
              border: 'none',
              cursor: saving || !email.trim() ? 'not-allowed' : 'pointer',
              opacity: saving || !email.trim() ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {saving ? 'Saving…' : 'Save and continue →'}
          </button>
        </form>

        <p style={{ marginTop: '20px', color: 'var(--muted)', fontSize: '12px' }}>
          Only used for Purch message notifications. Never shared.
        </p>
      </div>
    </div>
  )
}
