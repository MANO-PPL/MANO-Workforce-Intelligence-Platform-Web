// frontend/public/firebase-messaging-sw.js

// Import Firebase App and Messaging libraries
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker.
// Note: Replace these config placeholders with your Firebase project Web App credentials.
// You can find these in the Firebase Console: Project Settings > General > Your apps (Web)
firebase.initializeApp({
    apiKey: "AIzaSyAvyjiJJ6MunjisEjt4K1rhHDeuFgi_8fo",
    authDomain: "attendance-app-14f60.firebaseapp.com",
    projectId: "attendance-app-14f60",
    storageBucket: "attendance-app-14f60.firebasestorage.app",
    messagingSenderId: "274826785203",
    appId: "1:274826785203:web:3d6c05a76017ba39dd9bc6"
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
        icon: '/logo.png', // Ensure this points to a valid logo or fallback
        badge: '/favicon.ico',
        data: payload.data || {},
        tag: payload.data?.notification_id || 'workforce-notification', // collapse duplicate notifications
        requireInteraction: false
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

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
