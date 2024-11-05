importScripts("https://js.pusher.com/beams/service-worker.js");

self.addEventListener('push', function(event) {
    const data = event.data.json(); // assuming your server sends JSON data
    const title = data.title;
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // Close the notification
    // Handle the notification click, e.g., open a URL
    event.waitUntil(
        clients.openWindow('https://www.example.com')
    );
});
