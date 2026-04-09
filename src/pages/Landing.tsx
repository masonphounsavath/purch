import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { SignInModal } from '../components/auth/SignInModal'
import { useAuth } from '../hooks/useAuth'
import { ArrowRight, MapPin, MessageCircle, Shield, Bed } from 'lucide-react'

function ListingCard({
  title,
  price,
  dates,
  tags,
  rotate,
}: {
  title: string
  price: string
  dates: string
  tags: string[]
  rotate: string
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-64 ${rotate}`}>
      <div className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-xl h-32 mb-3 flex items-center justify-center">
        <MapPin className="w-6 h-6 text-unc-blue opacity-50" />
      </div>
      <p className="font-semibold text-unc-navy text-sm leading-snug mb-1">{title}</p>
      <p className="text-unc-blue font-bold text-lg">{price}<span className="text-xs text-slate-400 font-normal">/mo</span></p>
      <p className="text-xs text-slate-400 mt-1 mb-2">{dates}</p>
      <div className="flex gap-1.5 flex-wrap">
        {tags.map(t => (
          <span key={t} className="text-[10px] font-medium bg-gray-100 text-slate-500 px-2 py-0.5 rounded-full">{t}</span>
        ))}
      </div>
    </div>
  )
}

export default function Landing() {
  const { isAuthed } = useAuth()
  const [showSignIn, setShowSignIn] = useState(false)

  return (
    <div className="min-h-screen bg-white text-unc-navy">
      <Navbar />
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_60%_-10%,rgba(75,156,211,0.12),transparent)]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_top_right,rgba(75,156,211,0.08),transparent_70%)]" />

        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            <p className="text-sm font-semibold text-unc-blue tracking-widest uppercase mb-6">
              Chapel Hill · @unc.edu only
            </p>
            <h1 className="text-5xl md:text-[62px] font-bold leading-[1.08] tracking-tight mb-6">
              Find your next<br />
              sublease.<br />
              <span className="text-unc-blue">Without the hassle.</span>
            </h1>
            <p className="text-lg text-slate-body leading-relaxed mb-10 max-w-md">
              Purch is the sublease marketplace built exclusively for UNC students. Browse verified listings, message renters directly, and move in faster.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 bg-unc-navy text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-[#1c3a6b] transition-all hover:shadow-lg hover:shadow-unc-navy/20 text-[15px]"
              >
                Browse listings <ArrowRight className="w-4 h-4" />
              </Link>
              {isAuthed ? (
                <Link to="/post" className="text-[15px] font-medium text-slate-body hover:text-unc-navy transition-colors">
                  Post a sublease — free →
                </Link>
              ) : (
                <button
                  onClick={() => setShowSignIn(true)}
                  className="text-[15px] font-medium text-slate-body hover:text-unc-navy transition-colors"
                >
                  Post a sublease — free →
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-5">
              Sign in with your UNC credentials. No new account needed.
            </p>
          </div>

          {/* Right: floating listing cards */}
          <div className="relative hidden lg:block h-[420px]">
            <div className="absolute top-0 left-8">
              <ListingCard
                title="1BR on Franklin St near campus"
                price="$850"
                dates="Jun 1 – Aug 15"
                tags={['Furnished', 'Utilities incl.']}
                rotate="rotate-[-2deg]"
              />
            </div>
            <div className="absolute top-24 right-0">
              <ListingCard
                title="2BR/2BA at The Warehouse Apts"
                price="$1,100"
                dates="May 15 – Jul 31"
                tags={['2 bed', 'Gym', 'Pool']}
                rotate="rotate-[1.5deg]"
              />
            </div>
            <div className="absolute bottom-0 left-20">
              <ListingCard
                title="Studio near Carrboro, fully furnished"
                price="$720"
                dates="Jun 15 – Sep 1"
                tags={['Studio', 'A/C', 'Parking']}
                rotate="rotate-[-1deg]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider stat row ─────────────────────────────── */}
      <section className="border-y border-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center">
          {[
            { label: 'Listing fees', value: '$0' },
            { label: 'Access', value: '@unc.edu only' },
            { label: 'Messages', value: 'Real-time' },
            { label: 'Sign-in', value: 'UNC SSO' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-unc-navy">{value}</div>
              <div className="text-sm text-slate-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature: Browse ──────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-unc-blue text-sm font-semibold mb-5">
              <MapPin className="w-4 h-4" /> Browse &amp; filter
            </div>
            <h2 className="text-4xl md:text-[44px] font-bold leading-tight tracking-tight mb-6">
              See every listing<br />on the map.
            </h2>
            <p className="text-lg text-slate-body leading-relaxed mb-8">
              Filter by price, move-in date, furnished status, and amenities. Switch between a grid view and an interactive map of Chapel Hill to find listings close to campus or in your neighborhood.
            </p>
            <Link to="/browse" className="inline-flex items-center gap-1.5 text-unc-blue font-semibold hover:gap-3 transition-all">
              Start browsing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {/* Map placeholder */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl h-80 flex items-center justify-center border border-gray-100 shadow-sm">
            <div className="text-center">
              <MapPin className="w-10 h-10 text-unc-blue mx-auto mb-3 opacity-60" />
              <p className="text-sm text-slate-400 font-medium">Map view coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature: Messaging ───────────────────────────── */}
      <section className="py-28 px-6 bg-gray-50/60">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Message thread mockup */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-full bg-unc-blue/20 flex items-center justify-center text-xs font-bold text-unc-blue">JL</div>
              <div>
                <p className="text-sm font-semibold text-unc-navy">Jordan L.</p>
                <p className="text-xs text-slate-400">1BR on Franklin St</p>
              </div>
              <span className="ml-auto w-2 h-2 rounded-full bg-green-400" />
            </div>
            {[
              { me: false, text: 'Hey! Is the June 1st date flexible at all?' },
              { me: true, text: 'Yeah I can do May 25th or later, what works?' },
              { me: false, text: 'May 25th is perfect. Can we do a walkthrough this week?' },
            ].map((msg, i) => (
              <div key={i} className={`flex mb-3 ${msg.me ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${msg.me ? 'bg-unc-blue text-white rounded-br-sm' : 'bg-gray-100 text-unc-navy rounded-bl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 text-unc-blue text-sm font-semibold mb-5">
              <MessageCircle className="w-4 h-4" /> In-app messaging
            </div>
            <h2 className="text-4xl md:text-[44px] font-bold leading-tight tracking-tight mb-6">
              Message renters<br />without sharing<br />your number.
            </h2>
            <p className="text-lg text-slate-body leading-relaxed">
              Every conversation lives inside Purch. No group chats, no DMs, no giving out your contact info to strangers. Just direct, real-time messages between verified UNC students.
            </p>
          </div>
        </div>
      </section>

      {/* ── Feature: Trust ───────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-unc-blue text-sm font-semibold mb-5">
              <Shield className="w-4 h-4" /> UNC verified
            </div>
            <h2 className="text-4xl md:text-[44px] font-bold leading-tight tracking-tight mb-6">
              Every user is a<br />real Tar Heel.
            </h2>
            <p className="text-lg text-slate-body leading-relaxed mb-8">
              Sign in with your UNC SSO — the same credentials you use for everything else on campus. No fake accounts, no anonymous listings. Everyone on Purch is a verified @unc.edu student.
            </p>
            <div className="flex flex-col gap-3">
              {[
                'No new password to remember',
                'Every listing tied to a real student',
                'Blocks non-UNC users entirely',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-slate-body text-[15px]">
                  <div className="w-5 h-5 rounded-full bg-unc-blue/10 flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-3 h-3 text-unc-blue" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-unc-navy rounded-3xl p-10 text-white">
            <Shield className="w-10 h-10 text-unc-blue mb-6 opacity-80" />
            <p className="text-2xl font-bold mb-3 leading-snug">Sign in once.<br />You're in.</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              UNC's Shibboleth SSO handles authentication. We never store your password and we only access your @unc.edu email to verify you're a student.
            </p>
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-slate-500 tracking-wide uppercase font-semibold">Powered by</p>
              <p className="text-white font-semibold mt-1">UNC Shibboleth SSO</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="py-28 px-6 bg-gray-50/60">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-[44px] font-bold tracking-tight mb-4">Up and running in minutes.</h2>
          <p className="text-lg text-slate-body mb-16">Three steps. No friction.</p>
          <div className="space-y-0">
            {[
              {
                n: '01',
                title: 'Sign in with your @unc.edu',
                desc: 'Click "Get started" and authenticate with your UNC credentials. No new account, no new password.',
                icon: <Shield className="w-5 h-5 text-unc-blue" />,
              },
              {
                n: '02',
                title: 'Browse or post a listing',
                desc: 'Search available subleases near campus filtered to your exact needs — or post your own in under five minutes.',
                icon: <Bed className="w-5 h-5 text-unc-blue" />,
              },
              {
                n: '03',
                title: 'Message and move in',
                desc: 'Chat directly with the other student, agree on terms, and lock in your sublease.',
                icon: <MessageCircle className="w-5 h-5 text-unc-blue" />,
              },
            ].map((step, i, arr) => (
              <div key={step.n} className="relative flex gap-8">
                {/* Line connector */}
                {i < arr.length - 1 && (
                  <div className="absolute left-[19px] top-14 bottom-0 w-px bg-gray-200" />
                )}
                <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center z-10">
                  {step.icon}
                </div>
                <div className="pb-14">
                  <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">{step.n}</p>
                  <h3 className="text-xl font-bold text-unc-navy mb-2">{step.title}</h3>
                  <p className="text-slate-body leading-relaxed max-w-lg">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-[52px] font-bold tracking-tight leading-tight mb-6">
            Your next place is<br />already on Purch.
          </h2>
          <p className="text-lg text-slate-body mb-10">
            Browse Chapel Hill subleases posted by students just like you.
          </p>
          {isAuthed ? (
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 bg-unc-navy text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#1c3a6b] transition-all hover:shadow-xl hover:shadow-unc-navy/20 text-[16px]"
            >
              Browse listings <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={() => setShowSignIn(true)}
              className="inline-flex items-center gap-2 bg-unc-navy text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#1c3a6b] transition-all hover:shadow-xl hover:shadow-unc-navy/20 text-[16px]"
            >
              Get started — it's free <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-bold text-unc-navy">Purch</span>
          <span className="text-sm text-slate-400">The Chapel Hill Sublease Marketplace</span>
          <span className="text-sm text-slate-400">Made for Tar Heels, by Tar Heels</span>
        </div>
      </footer>
    </div>
  )
}
