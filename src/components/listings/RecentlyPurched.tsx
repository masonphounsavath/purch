import { PartyPopper } from 'lucide-react'
import { Eyebrow } from '../ui/Eyebrow'
import { MIN_PUBLIC_PURCHED, type PurchedItem } from '../../hooks/usePurched'
import { cn } from '../../lib/utils'

function purchedAgo(ts: string) {
  const days = Math.floor((Date.now() - new Date(ts).getTime()) / 86_400_000)
  if (days < 1)  return 'today'
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days} days ago`
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

// "47 subleases Purch'd and counting" — hidden until there's a meaningful number
export function PurchedStat({ count, onDark = false, className }: {
  count: number | null
  onDark?: boolean
  className?: string
}) {
  if (count == null || count < MIN_PUBLIC_PURCHED) return null
  return (
    <p className={cn('flex items-baseline gap-2', className)}>
      <span className={cn('font-outfit text-[28px] font-extrabold leading-none tracking-[-0.02em]', onDark ? 'text-brand-sky' : 'text-brand-navy')}>
        {count.toLocaleString()}
      </span>
      <span className={cn('font-figtree text-[15px] font-medium', onDark ? 'text-brand-subtle' : 'text-brand-muted')}>
        subleases Purch'd and counting
      </span>
    </p>
  )
}

// Showcase of listings already taken through Purch. Display-only by design:
// no links, no message/save affordances, never shown on the map or in results.
export function RecentlyPurchedStrip({ items, count }: { items: PurchedItem[]; count: number | null }) {
  if (items.length === 0 || count == null || count < MIN_PUBLIC_PURCHED) return null
  return (
    <section aria-label="Recently Purch'd — no longer available" className="mt-12 rounded-2xl bg-brand-navy text-white p-5 sm:p-6">
      <div className="flex flex-col gap-1.5 mb-5">
        <Eyebrow onDark>RECENTLY PURCH'D</Eyebrow>
        <h2 className="font-outfit text-2xl font-extrabold tracking-[-0.02em]">Already taken through Purch</h2>
        <p className="text-sm text-brand-subtle">These are off the market and not available — just a look at what's been subleased lately.</p>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {items.map((item, i) => (
          <li key={i} className="rounded-xl bg-brand-navy-2 px-4 py-3 flex items-center gap-3 cursor-default select-none">
            <span className="w-9 h-9 shrink-0 rounded-[10px] bg-brand-sky/15 text-brand-sky flex items-center justify-center">
              <PartyPopper className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold truncate">{item.street}</p>
              <p className="text-[13px] text-brand-subtle truncate">
                {item.bedrooms === 0 ? 'Studio' : `${item.bedrooms}BR`} · Purch'd {purchedAgo(item.purched_at)}
              </p>
            </div>
            <span className="font-outfit text-lg font-extrabold whitespace-nowrap">
              ${item.rent.toLocaleString()}<span className="font-figtree text-xs font-medium text-brand-subtle">/mo</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
