import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, X, Check, ArrowRight, Loader } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { AMENITIES } from '../lib/constants'
import { geocodeAddress } from '../lib/geocode'
import { AddressAutocomplete } from '../components/AddressAutocomplete'

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

export default function PostListing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [amenities, setAmenities] = useState<string[]>([])
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { bedrooms: 1, bathrooms: 1, is_furnished: false },
  })

  function toggleAmenity(tag: string) {
    setAmenities(prev =>
      prev.includes(tag) ? prev.filter(a => a !== tag) : [...prev, tag]
    )
  }

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_MB = 10

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const invalid = files.find(
      f => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_MB * 1024 * 1024
    )
    if (invalid) {
      setError(`Photos must be JPG, PNG, or WEBP and under ${MAX_MB}MB each.`)
      e.target.value = ''
      return
    }
    const allowed = files.slice(0, 8)
    setPhotos(allowed)
    setPreviews(allowed.map(f => URL.createObjectURL(f)))
    setError('')
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!user) return
    setSubmitting(true)
    setError('')

    try {
      // 1. Geocode address (use pre-resolved coords if user picked a suggestion)
      const resolvedCoords = coords ?? await geocodeAddress(data.address)

      // 2. Create listing row first to get an ID
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          user_id:        user.id,
          title:          data.title,
          description:    data.description,
          address:        data.address,
          lat:            resolvedCoords?.lat ?? null,
          lng:            resolvedCoords?.lng ?? null,
          rent:           data.rent,
          available_from: data.available_from,
          available_to:   data.available_to,
          bedrooms:       data.bedrooms,
          bathrooms:      data.bathrooms,
          is_furnished:   data.is_furnished,
          amenities,
          photos:         [],
        })
        .select()
        .single()

      if (listingError) throw listingError

      // 2. Upload photos to Storage
      const photoUrls: string[] = []
      for (const file of photos) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${listing.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('listing-photos')
          .upload(path, file)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('listing-photos')
          .getPublicUrl(path)
        photoUrls.push(urlData.publicUrl)
      }

      // 3. Update listing with photo URLs
      if (photoUrls.length > 0) {
        await supabase
          .from('listings')
          .update({ photos: photoUrls })
          .eq('id', listing.id)
      }

      navigate(`/listings/${listing.id}`)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-20">

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-unc-navy mb-2">Post a sublease</h1>
          <p className="text-slate-body">Fill in the details and your listing goes live immediately.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">

          {/* ── The basics ── */}
          <section>
            <h2 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">The basics</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-unc-navy mb-1.5">Listing title</label>
                <input
                  {...register('title')}
                  placeholder="e.g. 1BR near Franklin St, fully furnished"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-unc-navy placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-unc-navy mb-1.5">Address</label>
                <AddressAutocomplete
                  value=""
                  onChange={val => setValue('address', val, { shouldValidate: true })}
                  onCoordsChange={(lat, lng) => setCoords({ lat, lng })}
                  error={errors.address?.message}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-unc-navy mb-1.5">Monthly rent ($)</label>
                <input
                  {...register('rent')}
                  type="number"
                  placeholder="850"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-unc-navy placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all"
                />
                {errors.rent && <p className="text-red-500 text-xs mt-1">{errors.rent.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-unc-navy mb-1.5">Description</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Tell potential subletters what makes your place great — neighborhood, nearby spots, what's included..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-unc-navy placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all resize-none"
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>
            </div>
          </section>

          {/* ── Availability ── */}
          <section>
            <h2 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Availability</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-unc-navy mb-1.5">Available from</label>
                <input
                  {...register('available_from')}
                  type="date"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-unc-navy focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all"
                />
                {errors.available_from && <p className="text-red-500 text-xs mt-1">{errors.available_from.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-unc-navy mb-1.5">Available to</label>
                <input
                  {...register('available_to')}
                  type="date"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-unc-navy focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all"
                />
                {errors.available_to && <p className="text-red-500 text-xs mt-1">{errors.available_to.message}</p>}
              </div>
            </div>
          </section>

          {/* ── Property details ── */}
          <section>
            <h2 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Property details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-unc-navy mb-1.5">Bedrooms</label>
                <select
                  {...register('bedrooms')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-unc-navy focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all bg-white"
                >
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n === 0 ? 'Studio' : n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-unc-navy mb-1.5">Bathrooms</label>
                <select
                  {...register('bathrooms')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-unc-navy focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all bg-white"
                >
                  {[0.5, 1, 1.5, 2, 2.5, 3].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-unc-navy mb-1.5">Furnished</label>
                <label className="flex items-center h-[46px] gap-3 px-4 rounded-xl border border-gray-200 cursor-pointer hover:border-unc-blue transition-colors">
                  <input type="checkbox" {...register('is_furnished')} className="w-4 h-4 accent-unc-blue" />
                  <span className="text-sm text-unc-navy">Yes</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-unc-navy mb-1.5">Utilities included</label>
                <label className="flex items-center h-[46px] gap-3 px-4 rounded-xl border border-gray-200 cursor-pointer hover:border-unc-blue transition-colors">
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
                    className="w-4 h-4 accent-unc-blue"
                  />
                  <span className="text-sm text-unc-navy">Yes</span>
                </label>
              </div>
            </div>
          </section>

          {/* ── Amenities ── */}
          <section>
            <h2 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(tag => {
                const selected = amenities.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleAmenity(tag)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
                      selected
                        ? 'bg-unc-navy text-white border-unc-navy'
                        : 'bg-white text-slate-600 border-gray-200 hover:border-unc-navy hover:text-unc-navy'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    {tag}
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Photos ── */}
          <section>
            <h2 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">
              Photos <span className="normal-case font-normal text-slate-300">— up to 8</span>
            </h2>
            {previews.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={src} className="w-full h-full object-cover rounded-xl" alt="" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
                {previews.length < 8 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-unc-blue transition-colors">
                    <Upload className="w-5 h-5 text-slate-300" />
                    <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
                  </label>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-unc-blue transition-colors group">
                <Upload className="w-6 h-6 text-slate-300 group-hover:text-unc-blue transition-colors mb-2" />
                <p className="text-sm text-slate-400">Click to upload photos</p>
                <p className="text-xs text-slate-300 mt-1">JPG, PNG, WEBP</p>
                <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
              </label>
            )}
          </section>

          {/* ── Submit ── */}
          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-unc-navy text-white font-semibold py-4 rounded-xl hover:bg-[#1c3a6b] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
          >
            {submitting ? (
              <><Loader className="w-4 h-4 animate-spin" /> Publishing...</>
            ) : (
              <>Publish listing <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

        </form>
      </div>
    </div>
  )
}
