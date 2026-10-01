import { useNavigate } from 'react-router-dom'
import { PurchLogo } from './ui/PurchLogo'
import { Eyebrow } from './ui/Eyebrow'
import { button } from './ui/styles'

interface Props {
  listingId?: string  // if set, back button navigates to that listing's edit page
  onBack: () => void
}

export function PhotoRequiredGate({ listingId, onBack }: Props) {
  const navigate = useNavigate()

  function handleBack() {
    if (listingId) navigate(`/listings/${listingId}/edit`)
    onBack()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-white text-brand-navy font-figtree">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-12">
          <PurchLogo size={36} />
        </div>

        <Eyebrow>ONE QUICK FIX</Eyebrow>
        <h1 className="font-outfit text-[clamp(32px,7vw,44px)] leading-[1.02] font-extrabold tracking-[-0.03em] mt-3 mb-3">
          Add a photo first.
        </h1>

        <p className="text-brand-muted text-base leading-relaxed mb-8">
          Listings with photos get significantly more interest. Add at least one shot of your space — it takes 30 seconds and makes a real difference.
        </p>

        <button type="button" onClick={handleBack} className={button('primary', 'lg', 'w-full')}>
          {listingId ? 'Go to my listing →' : '← Go back and add photos'}
        </button>
      </div>
    </div>
  )
}
