import { Info } from 'lucide-react'
import { cn } from '../../lib/utils'
import { container } from '../ui/styles'
import { PageShell } from './PageShell'
import { PageHero } from './PageHero'

function slug(title: string) {
  return title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export interface LegalSection {
  title: string
  body: React.ReactNode
}

// Shared shell for Privacy and Terms: hero, sticky contents list, numbered sections
export function LegalPage({ eyebrow, title, intro, updated, sections, contact }: {
  eyebrow: string
  title: string
  intro: string
  updated: string
  sections: LegalSection[]
  contact: React.ReactNode
}) {
  return (
    <PageShell>
      <PageHero eyebrow={eyebrow} title={title}>
        <p>{intro}</p>
        <p className="mt-3 text-[13px] font-semibold tracking-[0.2em] uppercase text-brand-sky">Last updated · {updated}</p>
      </PageHero>

      <div className={cn(container, 'py-16 lg:py-24 grid lg:grid-cols-[240px_minmax(0,1fr)] gap-10 lg:gap-20')}>
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-8 flex flex-col gap-1">
            <span className="text-[13px] font-semibold tracking-[0.2em] text-brand-muted mb-3">ON THIS PAGE</span>
            {sections.map((s, i) => (
              <a
                key={s.title}
                href={`#${slug(s.title)}`}
                className="flex gap-3 py-1.5 text-[15px] font-medium text-brand-muted hover:text-brand-navy transition-colors"
              >
                <span className="w-5 shrink-0 text-brand-sky-ink tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </a>
            ))}
          </div>
        </nav>

        <div className="max-w-[720px] flex flex-col">
          {sections.map((s, i) => (
            <section key={s.title} id={slug(s.title)} className="scroll-mt-8 py-9 first:pt-0 border-b border-brand-line last:border-0">
              <span className="font-outfit text-sm font-bold text-brand-sky-ink tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="font-outfit text-[26px] lg:text-[30px] leading-tight font-extrabold tracking-[-0.025em] mt-1 mb-4">{s.title}</h2>
              <div className="text-base lg:text-[17px] leading-[1.7] text-brand-muted space-y-4 [&_strong]:font-semibold [&_strong]:text-brand-navy">
                {s.body}
              </div>
            </section>
          ))}

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-brand-mist px-6 py-5">
            <Info className="w-5 h-5 mt-0.5 shrink-0 text-brand-sky-ink" />
            <p className="text-[15px] leading-relaxed text-brand-muted [&_a]:font-semibold [&_a]:text-brand-navy [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-brand-sky-ink">
              {contact}
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
