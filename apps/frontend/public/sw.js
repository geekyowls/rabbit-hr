self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }

  const title = data.title || 'RabbitHR';
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo-icon.png',
    badge: '/logo-icon.png',
    data: { url: data.url || '/dashboard' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            if ('navigate' in client) {
              client.navigate(url).catch(() => {});
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
  );
});
