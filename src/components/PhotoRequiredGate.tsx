import { useNavigate } from 'react-router-dom'

interface Props {
  listingId?: string  // if set, back button navigates to that listing's edit page
  onBack: () => void
}

export function PhotoRequiredGate({ listingId, onBack }: Props) {
  const navigate = useNavigate()

  function handleBack() {
    if (listingId) navigate(`/listings/${listingId}/edit`)
    onBack()
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
          Add a photo first.
        </h1>

        <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
          Listings with photos get significantly more interest. Add at least one shot of your space — it takes 30 seconds and makes a real difference.
        </p>

        <button
          type="button"
          onClick={handleBack}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: '999px',
            background: 'var(--ink)',
            color: 'var(--bg)',
            fontSize: '15px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {listingId ? 'Go to my listing →' : '← Go back and add photos'}
        </button>
      </div>
    </div>
  )
}
