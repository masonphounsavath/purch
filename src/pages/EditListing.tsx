import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, X, Check, ArrowRight, Loader, ArrowLeft } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Eyebrow } from '../components/ui/Eyebrow'
import { button, field, fieldError, fieldLabel } from '../components/ui/styles'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import { AMENITIES } from '../lib/constants'
import { geocodeAddress } from '../lib/geocode'
import { AddressAutocomplete } from '../components/AddressAutocomplete'
import { PhotoRequiredGate } from '../components/PhotoRequiredGate'

const sectionCard = 'rounded-[20px] border border-brand-line bg-white p-5 sm:p-7'
const sectionTitle = 'font-outfit text-xl font-bold tracking-[-0.01em] mb-5'
const toggleBox = 'flex items-center h-[50px] gap-3 px-4 rounded-[10px] border border-brand-line bg-white cursor-pointer hover:border-brand-sky transition-colors'
const removeBtn = 'absolute top-2 right-2 w-7 h-7 bg-brand-navy/80 rounded-full flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'
const chip = (on: boolean) => cn(
  'inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-semibold transition-colors',
  on ? 'bg-brand-navy text-white' : 'bg-white text-brand-navy border border-brand-line hover:bg-brand-mist',
)

const schema = z.object({
  title:          z.string().min(5, 'Title must be at least 5 characters'),
  description:    z.string().min(20, 'Add a bit more detail (20 chars min)'),
  address:        z.string().min(5, 'Enter a full address'),
  rent:           z.coerce.number().min(100, 'Rent must be at least $100').max(10000),
  available_from: z.string().min(1, 'Pick a start date'),
  available_to:   z.string().min(1, 'Pick an end date'),
  bedrooms:       z.coerce.number().min(0).max(10),
  bathrooms:      z.coerce.number().min(0.5).max(10),
  is_furnished:   z.boolean(),
})

type FormData = z.infer<typeof schema>

export default function EditListing() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [amenities, setAmenities] = useState<string[]>([])
  const [preferredGender, setPreferredGender] = useState<'female' | 'male' | null>(null)
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])
  const [removedPhotos, setRemovedPhotos] = useState<Set<string>>(new Set())
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [fetchLoading, setFetchLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [showPhotoGate, setShowPhotoGate] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { bedrooms: 1, bathrooms: 1, is_furnished: false },
  })

  useEffect(() => {
    if (!id || !user) return
    async function fetchListing() {
      setFetchLoading(true)
      const { data } = await supabase.from('listings').select('*').eq('id', id).single()
      if (!data || data.user_id !== user?.id) {
        setNotFound(true)
        setFetchLoading(false)
        return
      }
      reset({
        title:          data.title,
        description:    data.description,
        address:        data.address,
        rent:           data.rent,
        available_from: data.available_from,
        available_to:   data.available_to,
        bedrooms:       data.bedrooms,
        bathrooms:      data.bathrooms,
        is_furnished:   data.is_furnished,
      })
      setAmenities(data.amenities ?? [])
      setPreferredGender(data.preferred_gender ?? null)
      setExistingPhotos(data.photos ?? [])
      setFetchLoading(false)
    }
    fetchListing()
  }, [id, user, reset])

  function toggleAmenity(tag: string) {
    setAmenities(prev => prev.includes(tag) ? prev.filter(a => a !== tag) : [...prev, tag])
  }

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_MB = 10

  function handleNewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const invalid = files.find(
      f => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_MB * 1024 * 1024
    )
    if (invalid) {
      setError(`Photos must be JPG, PNG, or WEBP and under ${MAX_MB}MB each.`)
      e.target.value = ''
      return
    }
    const remaining = 8 - (existingPhotos.length - removedPhotos.size) - newPhotos.length
    const added = files.slice(0, Math.max(0, remaining))
    setNewPhotos(prev => [...prev, ...added])
    setNewPreviews(prev => [...prev, ...added.map(f => URL.createObjectURL(f))])
    setError('')
  }

  function removeExisting(url: string) {
    setRemovedPhotos(prev => new Set([...prev, url]))
  }

  function removeNew(i: number) {
    setNewPhotos(prev => prev.filter((_, idx) => idx !== i))
    setNewPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!user || !id) return
    const totalPhotos = existingPhotos.filter(u => !removedPhotos.has(u)).length + newPhotos.length
    if (totalPhotos === 0) { setShowPhotoGate(true); return }
    setSubmitting(true)
    setError('')

    try {
      // Delete removed photos from Storage
      if (removedPhotos.size > 0) {
        const paths = Array.from(removedPhotos).map(url => {
          const marker = '/listing-photos/'
          return url.slice(url.indexOf(marker) + marker.length)
        })
        await supabase.storage.from('listing-photos').remove(paths)
      }

      const keptPhotos = existingPhotos.filter(url => !removedPhotos.has(url))

      const newUrls: string[] = []
      for (const file of newPhotos) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('listing-photos')
          .upload(path, file)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(path)
        newUrls.push(urlData.publicUrl)
      }

      // Re-geocode in case address changed (use pre-resolved coords if user picked a suggestion)
      const coords = resolvedCoords ?? await geocodeAddress(data.address)

      const { error: updateError } = await supabase.from('listings').update({
        title:          data.title,
        description:    data.description,
        address:        data.address,
        lat:            coords?.lat ?? null,
        lng:            coords?.lng ?? null,
        rent:           data.rent,
        available_from: data.available_from,
        available_to:   data.available_to,
        bedrooms:       data.bedrooms,
        bathrooms:      data.bathrooms,
        is_furnished:   data.is_furnished,
        preferred_gender: preferredGender,
        amenities,
        photos:         [...keptPhotos, ...newUrls],
      }).eq('id', id)

      if (updateError) throw updateError
      navigate(`/listings/${id}`)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Try again.')
      setSubmitting(false)
    }
  }

  if (showPhotoGate) return <PhotoRequiredGate onBack={() => setShowPhotoGate(false)} />

  if (fetchLoading) {
    return (
      <PageShell footer={false}>
        <div className="pt-40 flex justify-center"><Loader className="w-6 h-6 text-brand-sky animate-spin" /></div>
      </PageShell>
    )
  }

  if (notFound) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-6 py-32 text-center flex flex-col items-center gap-3">
          <Eyebrow>404</Eyebrow>
          <p className="font-outfit text-4xl font-extrabold tracking-[-0.03em]">Listing not found.</p>
          <p className="text-brand-muted mb-4">It may have been removed, or it isn't yours to edit.</p>
          <Link to="/profile" className={button('primary', 'sm')}>Go to my listings</Link>
        </div>
      </PageShell>
    )
  }

  const totalPhotos = existingPhotos.filter(u => !removedPhotos.has(u)).length + newPhotos.length

  return (
    <PageShell>
      <section className="bg-brand-navy text-white">
        <div className="max-w-[760px] mx-auto px-5 sm:px-6 pt-8 lg:pt-12 pb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[15px] font-semibold text-brand-subtle hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Eyebrow onDark>YOUR LISTING</Eyebrow>
          <h1 className="font-outfit text-[40px] sm:text-[52px] leading-none font-extrabold tracking-[-0.035em] mt-3 mb-3">Edit listing</h1>
          <p className="text-lg text-brand-subtle">Changes go live immediately.</p>
        </div>
      </section>

      <div className="max-w-[760px] mx-auto px-5 sm:px-6 py-10 pb-24">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ── The basics ── */}
          <section className={sectionCard}>
            <h2 className={sectionTitle}>The basics</h2>
            <div className="space-y-5">
              <div>
                <label className={fieldLabel}>Listing title</label>
                <input
                  {...register('title')}
                  placeholder="e.g. 1BR near Franklin St, fully furnished"
                  className={field}
                />
                {errors.title && <p className={fieldError}>{errors.title.message}</p>}
              </div>
              <div>
                <label className={fieldLabel}>Address</label>
                <AddressAutocomplete
                  value={watch('address') ?? ''}
                  onChange={val => setValue('address', val, { shouldValidate: true })}
                  onCoordsChange={(lat, lng) => setResolvedCoords({ lat, lng })}
                  error={errors.address?.message}
                />
                {errors.address && <p className={fieldError}>{errors.address.message}</p>}
              </div>
              <div>
                <label className={fieldLabel}>Monthly rent ($)</label>
                <input
                  {...register('rent')}
                  type="number"
                  placeholder="850"
                  className={field}
                />
                {errors.rent && <p className={fieldError}>{errors.rent.message}</p>}
              </div>
              <div>
                <label className={fieldLabel}>Description</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Tell potential subletters what makes your place great..."
                  className={cn(field, 'resize-none')}
                />
                {errors.description && <p className={fieldError}>{errors.description.message}</p>}
              </div>
            </div>
          </section>

          {/* ── Availability ── */}
          <section className={sectionCard}>
            <h2 className={sectionTitle}>Availability</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>Available from</label>
                <input
                  {...register('available_from')}
                  type="date"
                  className={field}
                />
                {errors.available_from && <p className={fieldError}>{errors.available_from.message}</p>}
              </div>
              <div>
                <label className={fieldLabel}>Available to</label>
                <input
                  {...register('available_to')}
                  type="date"
                  className={field}
                />
                {errors.available_to && <p className={fieldError}>{errors.available_to.message}</p>}
              </div>
            </div>
          </section>

          {/* ── Property details ── */}
          <section className={sectionCard}>
            <h2 className={sectionTitle}>Property details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>Bedrooms</label>
                <select
                  {...register('bedrooms')}
                  className={cn(field, 'cursor-pointer')}
                >
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n === 0 ? 'Studio' : n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fieldLabel}>Bathrooms</label>
                <select
                  {...register('bathrooms')}
                  className={cn(field, 'cursor-pointer')}
                >
                  {[0.5, 1, 1.5, 2, 2.5, 3].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fieldLabel}>Furnished</label>
                <label className={toggleBox}>
                  <input type="checkbox" {...register('is_furnished')} className="w-4 h-4 accent-brand-sky" />
                  <span className="text-[15px] font-medium">Yes</span>
                </label>
              </div>
              <div>
                <label className={fieldLabel}>Utilities included</label>
                <label className={toggleBox}>
                  <input
                    type="checkbox"
                    checked={amenities.includes('Utilities Included')}
                    onChange={e =>
                      setAmenities(prev =>
                        e.target.checked
                          ? [...prev.filter(a => a !== 'Utilities Included'), 'Utilities Included']
                          : prev.filter(a => a !== 'Utilities Included')
                      )
                    }
                    className="w-4 h-4 accent-brand-sky"
                  />
                  <span className="text-[15px] font-medium">Yes</span>
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className={fieldLabel}>Preferred subletter</label>
                <div className="flex gap-2">
                  {([
                    { label: 'Any', value: null },
                    { label: 'Female', value: 'female' as const },
                    { label: 'Male', value: 'male' as const },
                  ] as const).map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setPreferredGender(opt.value)}
                      aria-pressed={preferredGender === opt.value}
                      className={chip(preferredGender === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Amenities ── */}
          <section className={sectionCard}>
            <h2 className={sectionTitle}>Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(tag => {
                const selected = amenities.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleAmenity(tag)}
                    aria-pressed={selected}
                    className={chip(selected)}
                  >
                    {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    {tag}
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Photos ── */}
          <section className={sectionCard}>
            <h2 className={sectionTitle}>
              Photos <span className="font-figtree text-sm font-medium text-brand-muted">· {totalPhotos} of 8</span>
            </h2>
            {totalPhotos > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {existingPhotos.filter(u => !removedPhotos.has(u)).map((url, i) => (
                  <div key={`ex-${i}`} className="relative group aspect-square">
                    <img src={url} className="w-full h-full object-cover rounded-xl" alt="" />
                    <button
                      type="button"
                      onClick={() => removeExisting(url)}
                      aria-label="Remove photo"
                      className={removeBtn}
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
                {newPreviews.map((src, i) => (
                  <div key={`new-${i}`} className="relative group aspect-square">
                    <img src={src} className="w-full h-full object-cover rounded-xl" alt="" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-brand-sky text-brand-navy text-[11px] font-bold">New</span>
                    <button
                      type="button"
                      onClick={() => removeNew(i)}
                      aria-label="Remove photo"
                      className={removeBtn}
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
                {totalPhotos < 8 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-brand-line flex items-center justify-center cursor-pointer text-brand-muted hover:border-brand-sky hover:text-brand-sky-ink transition-colors">
                    <Upload className="w-5 h-5" />
                    <input type="file" accept="image/*" multiple onChange={handleNewPhotos} className="hidden" />
                  </label>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-44 rounded-2xl border-2 border-dashed border-brand-line bg-brand-mist/50 cursor-pointer hover:border-brand-sky transition-colors">
                <span className="w-12 h-12 rounded-[12px] bg-brand-navy text-brand-sky flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5" />
                </span>
                <p className="text-[15px] font-semibold text-brand-navy">Click to upload photos</p>
                <p className="text-[13px] text-brand-muted mt-1">JPG, PNG, WEBP</p>
                <input type="file" accept="image/*" multiple onChange={handleNewPhotos} className="hidden" />
              </label>
            )}
          </section>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-700 bg-red-50 border border-red-100 px-4 py-3 rounded-[10px]">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={button('primary', 'lg', 'w-full')}
          >
            {submitting ? (
              <><Loader className="w-4 h-4 animate-spin" /> Saving…</>
            ) : (
              <>Save changes <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

        </form>
      </div>
    </PageShell>
  )
}
