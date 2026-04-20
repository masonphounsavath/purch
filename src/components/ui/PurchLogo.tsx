interface PurchLogoProps {
  size?: number
  variant?: 'full' | 'icon'
  className?: string
}

export function PurchLogo({ size = 28, variant = 'full', className = '' }: PurchLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} aria-label="Purch">
      <svg
        width={size * 1.05}
        height={size * 1.05}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
        style={{ color: 'var(--ink)' }}
      >
        {/* Roof */}
        <path
          d="M9 22 L24 8 L39 22 Z"
          fill="var(--accent)"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Roof shadow */}
        <path d="M24 8 L24 11.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
        {/* Finial */}
        <circle cx="24" cy="7" r="1.3" fill="currentColor" />
        {/* House box */}
        <rect x="12" y="21" width="24" height="18" rx="1.2" fill="var(--paper)" stroke="currentColor" strokeWidth="1.5" />
        {/* Plank lines */}
        <path d="M12 27 L36 27" stroke="currentColor" strokeWidth="0.7" opacity="0.28" />
        <path d="M12 33 L36 33" stroke="currentColor" strokeWidth="0.7" opacity="0.28" />
        {/* Entrance hole */}
        <circle cx="24" cy="30" r="4.2" fill="currentColor" opacity="0.92" />
        <circle cx="24" cy="30" r="4.2" fill="none" stroke="var(--accent)" strokeWidth="0.9" opacity="0.5" />
        {/* Perch stick */}
        <path d="M21 36.2 L27 36.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="21" cy="36.2" r="0.7" fill="currentColor" />
        <circle cx="27" cy="36.2" r="0.7" fill="currentColor" />
        {/* Post */}
        <path d="M24 39 L24 46" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        {/* Bird body */}
        <path
          d="M30.5 17.5 C 30.5 15.2, 32.2 13.8, 34.3 13.8 C 36.6 13.8, 38.2 15.4, 38.2 17.4 C 38.2 18.2, 37.9 18.9, 37.5 19.4 L 38.4 20.8 C 38.6 21.1, 38.4 21.5, 38.1 21.5 L 31.4 21.5 C 30.8 21.5, 30.5 21.1, 30.5 20.6 Z"
          fill="var(--paper)"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        {/* Wing */}
        <path d="M33 17 C 34 16.2, 35.5 16.2, 36.5 17 C 36 18.5, 34.5 19, 33.2 18.5 Z" fill="currentColor" opacity="0.85" />
        {/* Beak */}
        <path d="M30.5 17 L 28.6 17.5 L 30.5 18.3 Z" fill="var(--accent)" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Eye */}
        <circle cx="32.2" cy="16.6" r="0.65" fill="currentColor" />
        <circle cx="32.35" cy="16.45" r="0.2" fill="var(--paper)" />
        {/* Tail feather */}
        <path d="M38.2 19.5 L 41 18.5 L 40.5 20.8 Z" fill="var(--paper)" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
      {variant === 'full' && (
        <span
          className="font-display"
          style={{
            fontSize: size * 0.92,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: 'var(--ink)',
          }}
        >
          purch
        </span>
      )}
    </span>
  )
}
