self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Purch', {
      body: data.body ?? 'You have a new message.',
      icon: '/logo-icon.png',
      badge: '/logo-icon.png',
      data: { url: data.url ?? 'https://purchit.org/messages' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const url = event.notification.data?.url ?? 'https://purchit.org/messages'
      for (const client of clientList) {
        if (client.url.includes('purchit.org') && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
