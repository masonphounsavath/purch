import { cn } from '../../lib/utils'
import { Header } from './Header'
import { Footer } from './Footer'

// Shared page frame: header, page body, footer, and room for the mobile tab bar
export function PageShell({ children, footer = true, className }: {
  children: React.ReactNode
  footer?: boolean
  className?: string
}) {
  return (
    <div className={cn('min-h-screen flex flex-col bg-white text-brand-navy font-figtree pb-16 md:pb-0', className)}>
      <Header />
      <main className="flex-1">{children}</main>
      {footer && <Footer />}
    </div>
  )
}
