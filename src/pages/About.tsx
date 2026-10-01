import { Link } from 'react-router-dom'
import { KeyRound, MapPin, MessageCircle, ShieldCheck, Code2 } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Reveal } from '../components/ui/Reveal'
import { Eyebrow } from '../components/ui/Eyebrow'
import { button, container, heroHeading, lede, sectionHeading, subHeading } from '../components/ui/styles'
import { cn } from '../lib/utils'

const stats = [
  { n: '2026', l: 'Founded' },
  { n: '@unc.edu', l: 'Access only' },
  { n: '100%', l: 'Free to use' },
  { n: '27514', l: 'Zip code' },
]

const steps = [
  {
    icon: KeyRound,
    title: 'Sign in with your @unc.edu',
    body: 'We email you a one-time code. No password, and no way in without a UNC address.',
  },
  {
    icon: MapPin,
    title: 'Find a place, or post yours',
    body: 'Browse every sublease on one map, sorted by the walk to where you need to be. Posting your place is free.',
  },
  {
    icon: MessageCircle,
    title: 'Talk it through in one thread',
    body: 'Message the host right on Purch. Every conversation about a place stays in one thread.',
  },
]

const values = [
  {
    icon: ShieldCheck,
    title: 'Verified community',
    body: 'Every person on Purch signed in with a @unc.edu address. No randos, no bots, no off-campus listings buried in the feed. Just Tar Heels helping Tar Heels.',
  },
  {
    icon: MapPin,
    title: 'Real locations',
    body: "Every listing is pinned to a real address on the map. No more 'DM for location' — you can see exactly where a place is before you message anyone.",
  },
  {
    icon: Code2,
    title: 'Built in the open',
    body: "Purch is a student project, not a startup. There's no growth team or ad revenue. If something's broken or confusing, email us and a real person will fix it.",
  },
]

export default function About() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="bg-brand-navy text-white">
        <div className={cn(container, 'pt-12 lg:pt-[72px] pb-16 lg:pb-[104px] grid lg:grid-cols-2 gap-12 lg:gap-16 items-center')}>
          <div className="flex flex-col gap-[26px]">
            <Eyebrow onDark>ABOUT PURCH</Eyebrow>
            <h1 className={heroHeading}>
              The sublease board Chapel Hill <span className="text-brand-sky">actually needed.</span>
            </h1>
            <p className="text-lg lg:text-[19px] leading-normal text-brand-subtle max-w-[520px]">
              Purch started because finding a summer sublease at UNC was embarrassing — a Snap story, a couple of Facebook groups, and a lot of unanswered DMs. We built the thing that should have existed.
            </p>
            <div className="flex flex-wrap items-center gap-x-[22px] gap-y-3">
              <Link to="/browse" className={button('primary', 'lg')}>Browse listings</Link>
              <a href="#how-it-works" className="text-base font-medium underline underline-offset-4 text-white hover:text-brand-sky transition-colors">
                How it works
              </a>
            </div>
          </div>
          <div className="h-[320px] sm:h-[440px] lg:h-[540px] rounded-[18px] overflow-hidden">
            <img src="/landing/walk-to-class.jpg" alt="Bright apartment living room" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-brand-line">
        <div className={cn(container, 'py-10 lg:py-12 grid grid-cols-2 md:grid-cols-4 gap-8')}>
          {stats.map(s => (
            <div key={s.l} className="flex flex-col gap-1">
              <span className="font-outfit text-[28px] lg:text-4xl font-extrabold tracking-[-0.03em]">{s.n}</span>
              <span className="text-[13px] font-semibold tracking-[0.2em] uppercase text-brand-muted">{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={cn(container, 'scroll-mt-8 pt-20 lg:pt-[104px] pb-20 lg:pb-28')}>
        <Reveal className="flex flex-col gap-10">
          <div className="flex flex-col gap-2.5">
            <Eyebrow>HOW IT WORKS</Eyebrow>
            <h2 className={subHeading}>Three steps from search to keys.</h2>
          </div>
          <ol className="grid md:grid-cols-3 gap-4">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex flex-col gap-5 p-7 rounded-2xl bg-brand-mist">
                <div className="flex items-center justify-between">
                  <span className="w-12 h-12 rounded-[12px] bg-brand-navy text-brand-sky flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="font-outfit text-4xl font-extrabold text-brand-line">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-outfit text-[21px] font-bold tracking-[-0.01em]">{title}</h3>
                  <p className="text-[15px] leading-relaxed text-brand-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {/* Verification */}
      <section id="verification" className={cn(container, 'scroll-mt-8 pb-20 lg:pb-28')}>
        <Reveal className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <div className="h-[320px] sm:h-[440px] lg:h-[540px] rounded-[18px] overflow-hidden">
            <img src="/landing/furnished.jpg" alt="Furnished apartment living room" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-5">
            <Eyebrow>VERIFIED</Eyebrow>
            <h2 className={sectionHeading}>Only Tar Heels get in.</h2>
            <p className={cn(lede, 'max-w-[500px]')}>
              Everyone on Purch signs in with a code sent to their @unc.edu. Every pin is a real address, and every conversation stays in one thread.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Values */}
      <section className={cn(container, 'pb-20 lg:pb-28')}>
        <Reveal className="p-6 sm:p-10 lg:p-[72px] rounded-[20px] bg-brand-mist flex flex-col gap-10">
          <div className="flex flex-col gap-2.5">
            <Eyebrow>WHAT WE STAND FOR</Eyebrow>
            <h2 className={subHeading}>Built by students, for students.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {values.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-4 p-7 rounded-2xl bg-white shadow-[0_10px_30px_rgba(5,30,55,0.06)]">
                <Icon className="w-6 h-6 text-brand-sky-ink" />
                <h3 className="font-outfit text-[21px] font-bold tracking-[-0.01em]">{title}</h3>
                <p className="text-[15px] leading-relaxed text-brand-muted">{body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className={cn(container, 'pb-20 lg:pb-24')}>
        <Reveal className="p-8 sm:p-12 lg:p-16 rounded-[20px] bg-brand-navy text-white flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12">
          <div className="flex flex-col gap-3 max-w-[560px]">
            <h2 className="font-outfit text-3xl sm:text-4xl lg:text-[44px] leading-[1.02] font-extrabold tracking-[-0.03em]">
              Skip the search. <span className="text-brand-sky">Purch it.</span>
            </h2>
            <p className="text-base lg:text-[17px] text-brand-subtle">
              Got feedback, a bug report, or just want to say hey? We'd love to hear from you.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/browse" className={button('primary', 'lg')}>Browse listings</Link>
            <Link to="/contact" className={button('ghost', 'lg', 'text-white border border-white/25 hover:bg-white/10')}>Get in touch</Link>
          </div>
        </Reveal>
      </section>
    </PageShell>
  )
}
