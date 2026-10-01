import { useState } from 'react'
import { usePushNotifications } from '../hooks/usePushNotifications'

export function PushOptIn({ userId }: { userId: string }) {
  const { permission, requestPermission } = usePushNotifications(userId)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || permission === 'granted' || permission === 'denied' || !('Notification' in window)) {
    return null
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm bg-brand-navy text-white font-figtree rounded-2xl shadow-[0_16px_40px_rgba(5,30,55,0.35)] px-5 py-4 flex flex-col gap-3">
      <div>
        <p className="font-outfit font-bold text-base">Get notified instantly</p>
        <p className="text-[13px] text-brand-subtle mt-0.5">Know the moment someone messages you about a sublease.</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => requestPermission()}
          className="flex-1 bg-brand-sky text-brand-navy text-sm font-bold rounded-[10px] py-2.5 hover:brightness-105 transition"
        >
          Turn on notifications
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-[13px] font-medium text-brand-subtle hover:text-white px-2 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
