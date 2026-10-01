import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Upload, X, Loader, Lightbulb } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { AddressAutocomplete } from '../components/AddressAutocomplete'
import { PhotoRequiredGate } from '../components/PhotoRequiredGate'
import { Eyebrow } from '../components/ui/Eyebrow'
import { button, field } from '../components/ui/styles'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import { AMENITIES } from '../lib/constants'
import { geocodeAddress } from '../lib/geocode'

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

const STEPS = ['Basics', 'Place', 'Dates & price', 'Photos', 'Review'] as const
const STEP_HEADINGS = [
  'Tell us about your place.',
  'Where is it?',
  'When & how much?',
  'Add some photos.',
  'Looks good?',
] as const


type FormState = {
  title: string
  description: string
  beds: number
  baths: number
  furnished: boolean
  preferredGender: 'female' | 'male' | null
  address: string
  amenities: string[]
  rent: number
  from: string
  to: string
}

export default function PostListing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    beds: 1,
    baths: 1,
    furnished: true,
    preferredGender: null,
    address: '',
    amenities: [],
    rent: 850,
    from: '',
    to: '',
  })
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [stepError, setStepError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPhotoGate, setShowPhotoGate] = useState(false)

  // ── Per-step validation ──────────────────────────────────────────
  function validate(): string {
    if (step === 0) {
      if (form.title.trim().length < 5) return 'Title must be at least 5 characters.'
      if (form.description.trim().length < 20) return 'Description must be at least 20 characters.'
    }
    if (step === 1) {
      if (form.address.trim().length < 5) return 'Enter a full street address.'
    }
    if (step === 2) {
      if (!form.from) return 'Pick a start date.'
      if (!form.to) return 'Pick an end date.'
      if (form.from >= form.to) return 'End date must be after start date.'
    }
    if (step === 3) {
      if (photos.length === 0) return 'PHOTO_REQUIRED'
    }
    return ''
  }

  async function next() {
    setStepError('')
    const err = validate()
    if (err === 'PHOTO_REQUIRED') { setShowPhotoGate(true); return }
    if (err) { setStepError(err); return }
    if (step === STEPS.length - 1) { await handleSubmit(); return }
    setStep(s => s + 1)
  }

  const back = () => {
    setStepError('')
    step === 0 ? navigate(-1) : setStep(s => s - 1)
  }

  // ── Photo handling ───────────────────────────────────────────────
  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
    const invalid = files.find(f => !ALLOWED.includes(f.type) || f.size > 10 * 1024 * 1024)
    if (invalid) {
      setStepError('Photos must be JPG, PNG, or WEBP and under 10MB each.')
      e.target.value = ''
      return
    }
    const toAdd = files.slice(0, 8 - photos.length)
    const next = [...photos, ...toAdd]
    setPhotos(next)
    setPreviews(next.map(f => URL.createObjectURL(f)))
    setStepError('')
  }

  function removePhoto(i: number) {
    const updated = photos.filter((_, idx) => idx !== i)
    setPhotos(updated)
    setPreviews(updated.map(f => URL.createObjectURL(f)))
  }

  function toggleAmenity(tag: string) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(tag)
        ? f.amenities.filter(a => a !== tag)
        : [...f.amenities, tag],
    }))
  }

  // ── Submit ───────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!user) return
    setSubmitting(true)
    setStepError('')
    try {
      const resolvedCoords = coords ?? await geocodeAddress(form.address)

      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          user_id:        user.id,
          title:          form.title,
          description:    form.description,
          address:        form.address,
          lat:            resolvedCoords?.lat ?? null,
          lng:            resolvedCoords?.lng ?? null,
          rent:           form.rent,
          available_from: form.from,
          available_to:   form.to,
          bedrooms:       form.beds,
          bathrooms:      form.baths,
          is_furnished:   form.furnished,
          preferred_gender: form.preferredGender,
          amenities:      form.amenities,
          photos:         [],
        })
        .select()
        .single()

      if (listingError) throw listingError

      const photoUrls: string[] = []
      for (const file of photos) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${listing.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('listing-photos')
          .upload(path, file)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(path)
        photoUrls.push(urlData.publicUrl)
      }

      if (photoUrls.length > 0) {
        await supabase.from('listings').update({ photos: photoUrls }).eq('id', listing.id)
      }

      setStep(STEPS.length)
    } catch (err: any) {
      setStepError(err.message ?? 'Something went wrong. Try again.')
      setSubmitting(false)
    }
  }

  // ── Photo gate ───────────────────────────────────────────────────
  if (showPhotoGate) return <PhotoRequiredGate onBack={() => setShowPhotoGate(false)} />

  // ── Success state ────────────────────────────────────────────────
  if (step === STEPS.length) {
    return (
      <PageShell>
        <div className="max-w-[680px] mx-auto px-6 py-24 lg:py-32 text-center flex flex-col items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220 }}
            className="w-20 h-20 rounded-full grid place-items-center mb-8 bg-brand-sky text-brand-navy"
          >
            <Check className="w-9 h-9" strokeWidth={3} />
          </motion.div>

          <Eyebrow>PUBLISHED</Eyebrow>
          <h1 className="font-outfit text-[44px] sm:text-[56px] leading-none font-extrabold tracking-[-0.035em] mt-3">
            Your listing is <span className="text-brand-sky-ink">live.</span>
          </h1>

          <p className="mt-5 text-lg text-brand-muted max-w-[460px]">
            Other UNC students can see it now. We'll email you when someone messages.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Btn onClick={() => navigate('/browse')} icon={<ArrowRight className="w-4 h-4" />}>
              View on Purch
            </Btn>
            <Btn variant="outline" onClick={() => navigate('/messages')}>
              See messages
            </Btn>
          </div>
        </div>
      </PageShell>
    )
  }

  // ── Main form ────────────────────────────────────────────────────
  return (
    <PageShell>
      {/* Step header + progress */}
      <section className="bg-brand-navy text-white">
        <div className="max-w-[720px] mx-auto px-5 sm:px-6 pt-10 lg:pt-14 pb-10">
          {/* Progress */}
          <ol className="flex items-center gap-2 mb-10" aria-label="Progress">
            {STEPS.map((s, i) => (
              <li key={s} className={cn('flex items-center gap-2', i < STEPS.length - 1 && 'flex-1')}>
                <span
                  aria-current={i === step ? 'step' : undefined}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 transition-colors',
                    i < step && 'bg-brand-sky text-brand-navy',
                    i === step && 'bg-white text-brand-navy',
                    i > step && 'border border-brand-navy-2 text-brand-subtle',
                  )}
                >
                  {i < step ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn(
                  'hidden sm:block text-[13px] whitespace-nowrap',
                  i === step ? 'font-bold text-white' : 'font-medium text-brand-subtle',
                )}>
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <span className={cn('flex-1 h-0.5 rounded-full min-w-3', i < step ? 'bg-brand-sky' : 'bg-brand-navy-2')} />
                )}
              </li>
            ))}
          </ol>

          <Eyebrow onDark>STEP {step + 1} OF {STEPS.length} · {STEPS[step].toUpperCase()}</Eyebrow>
          <h1 className="font-outfit text-[40px] sm:text-[52px] leading-none font-extrabold tracking-[-0.035em] mt-3">
            {STEP_HEADINGS[step]}
          </h1>
        </div>
      </section>

      <div className="max-w-[720px] mx-auto px-5 sm:px-6 pt-10 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease }}
            className="space-y-7"
          >
            {/* ── Step 0: Basics ── */}
            {step === 0 && (
              <>
                <Field label="Title">
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Sunny 1BR on Mitchell Lane"
                    className={field}
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    placeholder="Tell potential subletters what makes your place great — neighborhood, nearby spots, what's included..."
                    className={cn(field, 'resize-none')}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Bedrooms">
                    <select
                      value={form.beds}
                      onChange={e => setForm({ ...form, beds: +e.target.value })}
                      className={cn(field, 'cursor-pointer')}
                    >
                      <option value="0">Studio</option>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>

                  <Field label="Bathrooms">
                    <select
                      value={form.baths}
                      onChange={e => setForm({ ...form, baths: +e.target.value })}
                      className={cn(field, 'cursor-pointer')}
                    >
                      {[0.5, 1, 1.5, 2, 2.5, 3].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>

                  <Field label="Furnished">
                    <div className="flex gap-2">
                      <Chip selected={form.furnished} onClick={() => setForm({ ...form, furnished: true })}>Yes</Chip>
                      <Chip selected={!form.furnished} onClick={() => setForm({ ...form, furnished: false })}>No</Chip>
                    </div>
                  </Field>
                </div>

                <Field label="Preferred subletter">
                  <div className="flex gap-2">
                    <Chip selected={form.preferredGender === null} onClick={() => setForm({ ...form, preferredGender: null })}>Any</Chip>
                    <Chip selected={form.preferredGender === 'female'} onClick={() => setForm({ ...form, preferredGender: 'female' })}>Female</Chip>
                    <Chip selected={form.preferredGender === 'male'} onClick={() => setForm({ ...form, preferredGender: 'male' })}>Male</Chip>
                  </div>
                </Field>
              </>
            )}

            {/* ── Step 1: Place ── */}
            {step === 1 && (
              <>
                <Field label="Street address">
                  <AddressAutocomplete
                    value={form.address}
                    onChange={val => setForm({ ...form, address: val })}
                    onCoordsChange={(lat, lng) => setCoords({ lat, lng })}
                  />
                </Field>

                <Field label="Amenities">
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map(tag => (
                      <Chip
                        key={tag}
                        selected={form.amenities.includes(tag)}
                        onClick={() => toggleAmenity(tag)}
                      >
                        {tag}
                      </Chip>
                    ))}
                  </div>
                </Field>
              </>
            )}

            {/* ── Step 2: Dates & price ── */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Available from">
                    <input
                      type="date"
                      value={form.from}
                      onChange={e => setForm({ ...form, from: e.target.value })}
                      className={field}
                    />
                  </Field>

                  <Field label="Available to">
                    <input
                      type="date"
                      value={form.to}
                      onChange={e => setForm({ ...form, to: e.target.value })}
                      className={field}
                    />
                  </Field>
                </div>

                <Field label={`Monthly rent · $${form.rent}`}>
                  <div className="rounded-2xl bg-brand-mist p-5">
                    <p className="font-outfit text-[44px] leading-none font-extrabold tracking-[-0.03em] mb-4">
                      ${form.rent.toLocaleString()}<span className="font-figtree text-base font-medium text-brand-muted">/mo</span>
                    </p>
                    <input
                      type="range"
                      min={400}
                      max={2200}
                      step={25}
                      value={form.rent}
                      onChange={e => setForm({ ...form, rent: +e.target.value })}
                      className="w-full accent-brand-sky cursor-pointer"
                    />
                    <div className="flex justify-between text-[13px] font-medium mt-1 text-brand-muted">
                      <span>$400</span>
                      <span>$2,200</span>
                    </div>
                  </div>
                </Field>
              </>
            )}

            {/* ── Step 3: Photos ── */}
            {step === 3 && (
              <>
              <div className="flex items-start gap-3 rounded-2xl px-5 py-4 bg-brand-mist">
                <Lightbulb className="w-5 h-5 mt-0.5 flex-shrink-0 text-brand-sky-ink" />
                <p className="text-sm leading-relaxed text-brand-muted">
                  <span className="font-bold text-brand-navy">Tip:</span> 16:9 photos look best on Purch — aim for <span className="font-semibold text-brand-navy">1920×1080</span> or similar. Landscape shots of rooms perform significantly better than portrait or square crops.
                </p>
              </div>
              <Field label={`Photos · ${photos.length} of 8`}>
                {previews.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {previews.map((src, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img src={src} className="w-full h-full object-cover rounded-xl" alt="" />
                        {i === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-brand-navy/85 text-white text-[11px] font-semibold">Cover</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          aria-label="Remove photo"
                          className="absolute top-1.5 right-1.5 w-7 h-7 bg-brand-navy/80 rounded-full flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ))}
                    {photos.length < 8 && (
                      <label className="aspect-square rounded-xl grid place-items-center cursor-pointer border-2 border-dashed border-brand-line text-brand-muted hover:border-brand-sky hover:text-brand-sky-ink transition-colors">
                        <Upload className="w-5 h-5" />
                        <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
                      </label>
                    )}
                  </div>
                ) : (
                  <label className="group flex flex-col items-center justify-center w-full h-48 rounded-2xl cursor-pointer border-2 border-dashed border-brand-line bg-brand-mist/50 hover:border-brand-sky transition-colors">
                    <span className="w-12 h-12 rounded-[12px] bg-brand-navy text-brand-sky flex items-center justify-center mb-3">
                      <Upload className="w-5 h-5" />
                    </span>
                    <span className="text-[15px] font-semibold text-brand-navy">Click to upload photos</span>
                    <span className="text-[13px] mt-1 text-brand-muted">JPG, PNG, WEBP · max 10MB</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
                  </label>
                )}
              </Field>
              </>
            )}

            {/* ── Step 4: Review ── */}
            {step === 4 && (
              <div className="rounded-[20px] border border-brand-line bg-white shadow-[0_10px_30px_rgba(5,30,55,0.08)] p-5 sm:p-6">
                {previews[0] && (
                  <img
                    src={previews[0]}
                    className="w-full rounded-[14px] object-cover aspect-[16/9]"
                    alt=""
                  />
                )}
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-outfit text-[28px] leading-tight font-extrabold tracking-[-0.02em]">
                      {form.title}
                    </h3>
                    <p className="text-sm mt-1 text-brand-muted">
                      {form.address}
                    </p>
                  </div>
                  <span className="font-outfit text-[28px] font-extrabold whitespace-nowrap">
                    ${form.rent}<span className="font-figtree text-sm font-medium text-brand-muted">/mo</span>
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span className="px-3 py-1.5 rounded-full bg-brand-mist">{form.beds === 0 ? 'Studio' : `${form.beds} bed`}</span>
                  <span className="px-3 py-1.5 rounded-full bg-brand-mist">{form.baths} bath</span>
                  <span className="px-3 py-1.5 rounded-full bg-brand-mist">{form.furnished ? 'Furnished' : 'Unfurnished'}</span>
                </div>
                {form.amenities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {form.amenities.map(a => (
                      <span
                        key={a}
                        className="text-[12px] font-medium px-2.5 py-1 rounded-full border border-brand-line text-brand-muted"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-5 text-[15px] leading-relaxed text-brand-muted whitespace-pre-line">
                  {form.description}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Step error */}
        {stepError && (
          <p role="alert" className="mt-6 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-[10px] px-4 py-3">{stepError}</p>
        )}

        {/* Navigation */}
        <div className="mt-10 pt-6 border-t border-brand-line flex items-center justify-between">
          <Btn variant="ghost" onClick={back} icon={<ArrowLeft className="w-4 h-4" />} iconFirst>
            {step === 0 ? 'Cancel' : 'Back'}
          </Btn>
          <Btn
            onClick={next}
            disabled={submitting}
            icon={submitting ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          >
            {submitting ? 'Publishing…' : step === STEPS.length - 1 ? 'Publish listing' : 'Continue'}
          </Btn>
        </div>
      </div>
    </PageShell>
  )
}

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────

function Btn({
  children,
  onClick,
  variant = 'primary',
  icon,
  iconFirst = false,
  disabled = false,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'ghost' | 'accent'
  icon?: React.ReactNode
  iconFirst?: boolean
  disabled?: boolean
  className?: string
}) {
  const variants = {
    primary: button('primary', 'sm'),
    accent:  button('dark', 'sm'),
    outline: button('outline', 'sm'),
    ghost:   button('ghost', 'sm'),
  }
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { y: -1 }}
      whileTap={disabled ? {} : { y: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(variants[variant], className)}
    >
      {iconFirst && icon}
      {children}
      {!iconFirst && icon}
    </motion.button>
  )
}

function Chip({
  children,
  onClick,
  selected,
}: {
  children: React.ReactNode
  onClick?: () => void
  selected?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!selected}
      className={cn(
        'inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-semibold transition-colors',
        selected ? 'bg-brand-navy text-white' : 'bg-white text-brand-navy border border-brand-line hover:bg-brand-mist',
      )}
    >
      {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-brand-navy mb-2">
        {label}
      </label>
      {children}
    </div>
  )
}
