interface PurchLogoProps {
  size?: number
  className?: string
}

export function PurchLogo({ size = 28, className = '' }: PurchLogoProps) {
  return (
    <img
      src="/logo-icon.svg"
      alt="Purch"
      height={size}
      style={{ height: size, width: 'auto', display: 'block' }}
      className={className}
    />
  )
}
