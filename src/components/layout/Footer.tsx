import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { container } from '../ui/styles'

const cols = [
  { title: 'Product', links: [['Browse', '/browse'], ['Post a sublease', '/post'], ['Messages', '/messages']] },
  { title: 'Company', links: [['About', '/about'], ['Contact', '/contact']] },
  { title: 'Legal',   links: [['Terms', '/terms'], ['Privacy', '/privacy']] },
]

export function Footer() {
  return (
    <footer className="bg-brand-navy text-white font-figtree">
      <div className={cn(container, 'py-14 flex flex-col gap-10')}>
        <div className="flex flex-col gap-3.5">
          <img src="/brand/purch_exact_reference.svg" alt="purch" className="h-12 w-auto self-start block" />
          <span className="text-xs font-medium tracking-[0.34em] text-[#C9D5E3]">STUDENT SUBLEASES</span>
        </div>
        <div className="flex flex-wrap gap-x-[120px] gap-y-8 text-[15px]">
          {cols.map(col => (
            <div key={col.title} className="flex flex-col gap-3">
              <span className="font-bold">{col.title}</span>
              {col.links.map(([label, to]) => (
                <Link key={to} to={to} className="text-[#C9D5E3] hover:text-white transition-colors">{label}</Link>
              ))}
            </div>
          ))}
        </div>
        <span className="text-[13px] text-brand-subtle">© Purch · Chapel Hill, NC</span>
      </div>
    </footer>
  )
}
