self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  event.waitUntil(
    self.registration.showNotification(data.title || 'Minha Cidade', {
      body: data.body || 'Há uma atualização.',
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(self.clients.openWindow(url));
});