self.addEventListener('push', (event) =>{
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'close',
        title: 'Kapat',
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Horlog', options)
  );
});

self.addEventListener('notificationclick', (event) =>{
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.openWindow('/')
  );
}); 