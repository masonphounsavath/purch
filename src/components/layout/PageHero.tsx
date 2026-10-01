import { cn } from '../../lib/utils'
import { Eyebrow } from '../ui/Eyebrow'
import { container } from '../ui/styles'

// Navy title band that opens interior pages, matching the landing hero
export function PageHero({ eyebrow, title, children, className }: {
  eyebrow: string
  title: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <section className="bg-brand-navy text-white">
      <div className={cn(container, 'pt-14 lg:pt-20 pb-14 lg:pb-20 flex flex-col gap-5', className)}>
        <Eyebrow onDark>{eyebrow}</Eyebrow>
        <h1 className="font-outfit text-[40px] sm:text-5xl lg:text-[64px] leading-[0.98] font-extrabold tracking-[-0.035em] max-w-[900px]">
          {title}
        </h1>
        {children && (
          <div className="text-lg lg:text-[19px] leading-normal text-brand-subtle max-w-[620px]">{children}</div>
        )}
      </div>
    </section>
  )
}
