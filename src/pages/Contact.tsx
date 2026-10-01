import { ArrowRight, Bug, Flag, Lightbulb, Mail, Trash2 } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { PageHero } from '../components/layout/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { Eyebrow } from '../components/ui/Eyebrow'
import { button, container, subHeading } from '../components/ui/styles'
import { cn } from '../lib/utils'

const EMAIL = 'mason@purchit.org'

const reasons = [
  { icon: Bug,       label: 'Bug report',    body: 'Something broken? Tell us exactly what happened.' },
  { icon: Lightbulb, label: 'Feedback',      body: "Feature idea or something we could do better — we're all ears." },
  { icon: Trash2,    label: 'Data request',  body: 'Want your data deleted or exported? Just ask.' },
  { icon: Flag,      label: 'Listing issue', body: 'See a fraudulent or misleading listing? Flag it here.' },
]

export default function Contact() {
  return (
    <PageShell>
      <PageHero eyebrow="CONTACT" title={<>Get in <span className="text-brand-sky">touch.</span></>}>
        Purch is a small team. Email us directly and a real person will reply.
      </PageHero>

      <div className={cn(container, 'py-16 lg:py-24 flex flex-col gap-16 lg:gap-20')}>
        {/* Primary email */}
        <Reveal className="p-8 sm:p-10 lg:p-14 rounded-[20px] bg-brand-mist grid lg:grid-cols-[minmax(0,1fr)_auto] gap-8 items-center">
          <div className="flex flex-col gap-4">
            <Eyebrow>PRIMARY CONTACT</Eyebrow>
            <a
              href={`mailto:${EMAIL}`}
              className="font-outfit text-[28px] sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] break-all hover:text-brand-sky-ink transition-colors"
            >
              {EMAIL}
            </a>
            <p className="text-base lg:text-[17px] leading-relaxed text-brand-muted max-w-[560px]">
              We aim to respond within 48 hours. If you're a UNC student with an urgent listing issue, mention that in the subject line.
            </p>
          </div>
          <a href={`mailto:${EMAIL}`} className={button('dark', 'md', 'self-start lg:self-center')}>
            <Mail className="w-5 h-5" /> Email us
          </a>
        </Reveal>

        {/* Reasons */}
        <Reveal className="flex flex-col gap-7">
          <div className="flex flex-col gap-2.5">
            <Eyebrow>WHAT'S IT ABOUT?</Eyebrow>
            <h2 className={subHeading}>Pick a topic and we'll take it from there.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reasons.map(({ icon: Icon, label, body }) => (
              <a
                key={label}
                href={`mailto:${EMAIL}?subject=${encodeURIComponent(label)}`}
                className="group flex flex-col gap-4 p-6 rounded-2xl border border-brand-line bg-white hover:border-brand-sky hover:shadow-[0_12px_32px_rgba(5,30,55,0.10)] transition"
              >
                <span className="w-11 h-11 rounded-[12px] bg-brand-navy text-brand-sky flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </span>
                <div className="flex flex-col gap-1.5 flex-1">
                  <span className="font-outfit text-[19px] font-bold">{label}</span>
                  <span className="text-[15px] leading-snug text-brand-muted">{body}</span>
                </div>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-sky-ink">
                  Email us <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </a>
            ))}
          </div>
        </Reveal>

        <p className="text-sm text-brand-muted">Chapel Hill, NC 27514 · made by Tar Heels</p>
      </div>
    </PageShell>
  )
}
