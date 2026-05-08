import { useState } from 'react'
import { usePushNotifications } from '../hooks/usePushNotifications'

export function PushOptIn({ userId }: { userId: string }) {
  const { permission, requestPermission } = usePushNotifications(userId)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || permission === 'granted' || permission === 'denied' || !('Notification' in window)) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm bg-[var(--ink)] text-[var(--bg)] rounded-2xl shadow-xl px-5 py-4 flex flex-col gap-3">
      <div>
        <p className="font-semibold text-sm">Get notified instantly</p>
        <p className="text-xs opacity-70 mt-0.5">Know the moment someone messages you about a sublease.</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => requestPermission()}
          className="flex-1 bg-[var(--bg)] text-[var(--ink)] text-sm font-semibold rounded-xl py-2 hover:opacity-90 transition-opacity"
        >
          Turn on notifications
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs opacity-50 hover:opacity-80 px-2 transition-opacity"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
