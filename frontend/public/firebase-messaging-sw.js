// frontend/public/firebase-messaging-sw.js

// Import Firebase App and Messaging libraries
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Extract Firebase config from the query string (passed during service worker registration)
const params = new URLSearchParams(self.location.search);
const apiKey = params.get('apiKey');
const authDomain = params.get('authDomain');
const projectId = params.get('projectId');
const storageBucket = params.get('storageBucket');
const messagingSenderId = params.get('messagingSenderId');
const appId = params.get('appId');

if (apiKey) {
    // Initialize the Firebase app dynamically using the extracted credentials
    firebase.initializeApp({
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId
    });

    // Retrieve an instance of Firebase Cloud Messaging.
    const messaging = firebase.messaging();

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message:', payload);

        // Customize notification behavior here
        const notificationTitle = payload.notification?.title || 'Workforce Alert';
        const notificationOptions = {
            body: payload.notification?.body || 'You have a new real-time alert.',
            icon: '/mano-logo.svg', // Points to a valid logo fallback
            badge: '/favicon.ico',
            data: payload.data || {},
            tag: payload.data?.notification_id || 'workforce-notification', // collapse duplicate notifications
            requireInteraction: false
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} else {
    console.warn('⚠️ [firebase-messaging-sw.js] Service worker loaded without active configuration parameters.');
}

// Handle clicking notifications in the background
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Direct user to the notifications page on click
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/notifications');
            }
        })
    );
});
