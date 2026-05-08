interface PurchLogoProps {
  size?: number
  variant?: 'full' | 'icon'
  className?: string
}

export function PurchLogo({ size = 28, variant = 'full', className = '' }: PurchLogoProps) {
  const src = variant === 'icon' ? '/logo-icon.png' : '/logo-full.png'
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
