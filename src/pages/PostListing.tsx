import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Upload, X, Loader } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { AddressAutocomplete } from '../components/AddressAutocomplete'
import { PhotoRequiredGate } from '../components/PhotoRequiredGate'
import { supabase } from '../lib/supabase'
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
      <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
        <Navbar />
        <div className="max-w-[680px] mx-auto px-6 pt-24 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220 }}
            className="w-16 h-16 rounded-full grid place-items-center mx-auto mb-6"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            <Check className="w-6 h-6" />
          </motion.div>

          <h1
            className="font-display"
            style={{ fontSize: 48, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)' }}
          >
            Your listing is live.
          </h1>

          <p className="mt-4 text-[15px]" style={{ color: 'var(--ink-2)' }}>
            Other UNC students can see it now. We'll email you when someone messages.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Btn onClick={() => navigate('/browse')} icon={<ArrowRight className="w-4 h-4" />}>
              View on Purch
            </Btn>
            <Btn variant="outline" onClick={() => navigate('/messages')}>
              See messages
            </Btn>
          </div>
        </div>
      </div>
    )
  }

  // ── Main form ────────────────────────────────────────────────────
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      <Navbar />

      <div className="max-w-[720px] mx-auto px-6 pt-8 pb-24">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.12em]"
                style={{ color: i <= step ? 'var(--ink)' : 'var(--muted)' }}
              >
                0{i + 1}
              </span>
              <span
                className="text-[12px]"
                style={{
                  color: i === step ? 'var(--ink)' : 'var(--muted)',
                  fontWeight: i === step ? 500 : 400,
                }}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <span className="w-6 h-px" style={{ background: 'var(--line)' }} />
              )}
            </div>
          ))}
        </div>

        <Eyebrow>Step {step + 1} of {STEPS.length}</Eyebrow>
        <h1
          className="font-display mt-2"
          style={{ fontSize: 44, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)' }}
        >
          {STEP_HEADINGS[step]}
        </h1>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease }}
            className="mt-8 space-y-6"
          >
            {/* ── Step 0: Basics ── */}
            {step === 0 && (
              <>
                <Field label="Title">
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Sunny 1BR on Mitchell Lane"
                    className="w-full rounded-2xl px-4 py-3 text-[15px] focus:outline-none"
                    style={{ background: 'var(--paper)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    placeholder="Tell potential subletters what makes your place great — neighborhood, nearby spots, what's included..."
                    className="w-full rounded-2xl px-4 py-3 text-[15px] focus:outline-none resize-none"
                    style={{ background: 'var(--paper)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                  />
                </Field>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="Bedrooms">
                    <select
                      value={form.beds}
                      onChange={e => setForm({ ...form, beds: +e.target.value })}
                      className="w-full rounded-2xl px-4 py-3 text-[15px]"
                      style={{ background: 'var(--paper)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                    >
                      <option value="0">Studio</option>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>

                  <Field label="Bathrooms">
                    <select
                      value={form.baths}
                      onChange={e => setForm({ ...form, baths: +e.target.value })}
                      className="w-full rounded-2xl px-4 py-3 text-[15px]"
                      style={{ background: 'var(--paper)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                    >
                      {[0.5, 1, 1.5, 2, 2.5, 3].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>

                  <Field label="Furnished">
                    <div className="flex gap-1.5 pt-1">
                      <Chip selected={form.furnished} onClick={() => setForm({ ...form, furnished: true })}>Yes</Chip>
                      <Chip selected={!form.furnished} onClick={() => setForm({ ...form, furnished: false })}>No</Chip>
                    </div>
                  </Field>
                </div>
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
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Available from">
                    <input
                      type="date"
                      value={form.from}
                      onChange={e => setForm({ ...form, from: e.target.value })}
                      className="w-full rounded-2xl px-4 py-3 text-[15px]"
                      style={{ background: 'var(--paper)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                    />
                  </Field>

                  <Field label="Available to">
                    <input
                      type="date"
                      value={form.to}
                      onChange={e => setForm({ ...form, to: e.target.value })}
                      className="w-full rounded-2xl px-4 py-3 text-[15px]"
                      style={{ background: 'var(--paper)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                    />
                  </Field>
                </div>

                <Field label={`Monthly rent · $${form.rent}`}>
                  <input
                    type="range"
                    min={400}
                    max={2200}
                    step={25}
                    value={form.rent}
                    onChange={e => setForm({ ...form, rent: +e.target.value })}
                    className="w-full"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className="flex justify-between font-mono text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
                    <span>$400</span>
                    <span>$2,200</span>
                  </div>
                </Field>
              </>
            )}

            {/* ── Step 3: Photos ── */}
            {step === 3 && (
              <Field label={`Photos · ${photos.length} of 8`}>
                {previews.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {previews.map((src, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img src={src} className="w-full h-full object-cover rounded-2xl" alt="" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {photos.length < 8 && (
                      <label
                        className="aspect-square rounded-2xl grid place-items-center cursor-pointer eased"
                        style={{ background: 'var(--paper)', border: '1.5px dashed var(--line)', color: 'var(--muted)' }}
                      >
                        <Upload className="w-5 h-5" />
                        <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
                      </label>
                    )}
                  </div>
                ) : (
                  <label
                    className="flex flex-col items-center justify-center w-full h-40 rounded-2xl cursor-pointer eased"
                    style={{ background: 'var(--paper)', border: '1.5px dashed var(--line)' }}
                  >
                    <Upload className="w-6 h-6 mb-2" style={{ color: 'var(--muted)' }} />
                    <span className="text-[14px]" style={{ color: 'var(--muted)' }}>Click to upload photos</span>
                    <span className="font-mono text-[11px] mt-1" style={{ color: 'var(--muted)', opacity: 0.6 }}>JPG, PNG, WEBP · max 10MB</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
                  </label>
                )}
              </Field>
            )}

            {/* ── Step 4: Review ── */}
            {step === 4 && (
              <div
                className="rounded-2xl p-6"
                style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}
              >
                {previews[0] && (
                  <img
                    src={previews[0]}
                    className="w-full rounded-2xl object-cover"
                    style={{ aspectRatio: '16/9' }}
                    alt=""
                  />
                )}
                <h3
                  className="font-display text-2xl mt-5"
                  style={{ letterSpacing: '-0.01em', color: 'var(--ink)' }}
                >
                  {form.title}
                </h3>
                <p className="text-[13px] font-mono mt-1" style={{ color: 'var(--muted)' }}>
                  {form.address}
                </p>
                <div className="mt-4 flex items-center gap-4 text-[13px]" style={{ color: 'var(--ink-2)' }}>
                  <span>{form.beds === 0 ? 'Studio' : `${form.beds} bed`}</span>
                  <span>{form.baths} bath</span>
                  <span>{form.furnished ? 'Furnished' : 'Unfurnished'}</span>
                  <span className="ml-auto font-display text-2xl" style={{ letterSpacing: '-0.01em' }}>
                    ${form.rent}<span className="text-[13px]"> /mo</span>
                  </span>
                </div>
                {form.amenities.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {form.amenities.map(a => (
                      <span
                        key={a}
                        className="font-mono text-[10.5px] px-2 py-1 rounded-full"
                        style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-[13px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                  {form.description}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Step error */}
        {stepError && (
          <p className="mt-4 text-[13px]" style={{ color: '#c0392b' }}>{stepError}</p>
        )}

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          <Btn variant="ghost" onClick={back} icon={<ArrowLeft className="w-4 h-4" />}>
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
    </div>
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
  disabled = false,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'ghost' | 'accent'
  icon?: React.ReactNode
  disabled?: boolean
  className?: string
}) {
  const variants = {
    primary: { background: 'var(--ink)', color: 'var(--bg)', border: '1px solid transparent' },
    accent:  { background: 'var(--accent)', color: 'white', border: '1px solid transparent' },
    outline: { background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)' },
    ghost:   { background: 'transparent', color: 'var(--ink)', border: '1px solid transparent' },
  }
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { y: -1 }}
      whileTap={disabled ? {} : { y: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`inline-flex items-center gap-2 rounded-full font-medium eased ${className}`}
      style={{
        ...variants[variant],
        padding: '10px 16px',
        fontSize: 13.5,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
      {icon}
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
      className="inline-flex items-center gap-1.5 rounded-full eased"
      style={{
        fontSize: 11.5,
        letterSpacing: '.01em',
        padding: '5px 10px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        background: selected ? 'var(--ink)' : 'var(--paper)',
        color: selected ? 'var(--bg)' : 'var(--ink-2)',
        border: `1px solid ${selected ? 'var(--ink)' : 'var(--line)'}`,
      }}
    >
      {children}
    </button>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono uppercase text-[11px] tracking-[0.14em]" style={{ color: 'var(--muted)' }}>
      {children}
    </p>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="font-mono uppercase text-[10.5px] tracking-[0.14em] block mb-2"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
