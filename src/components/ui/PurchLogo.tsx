interface PurchLogoProps {
  size?: number
  variant?: 'full' | 'icon'
  className?: string
}

export function PurchLogo({ size = 28, variant = 'full', className = '' }: PurchLogoProps) {
  const src = variant === 'icon' ? '/brand/purch_exact_mark_dark.svg' : '/brand/purch_exact_reference_dark.svg'
  const alt = 'Purch'

  return (
    <img
      src={src}
      alt={alt}
      height={size}
      style={{ height: size, width: 'auto', display: 'block' }}
      className={className}
    />
  )
}
