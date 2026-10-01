import { cn } from '../../lib/utils'

// Small tracked-out label that sits above a section headline
export function Eyebrow({ children, onDark = false, className }: {
  children: React.ReactNode
  onDark?: boolean
  className?: string
}) {
  return (
    <span className={cn('text-[13px] font-semibold tracking-[0.3em]', onDark ? 'text-brand-sky' : 'text-brand-sky-ink', className)}>
      {children}
    </span>
  )
}
