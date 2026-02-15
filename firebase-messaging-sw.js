importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCyrUJWjWfpBYLT0T9aolvC_ui2qh_vC_A",
  authDomain: "control-de-flota-pro.firebaseapp.com",
  projectId: "control-de-flota-pro",
  storageBucket: "control-de-flota-pro.firebasestorage.app",
  messagingSenderId: "194939883399",
  appId: "1:194939883399:web:c20923d4f57dc5167d8d22"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Mensaje en background:', payload);
  
  const notificationTitle = payload.data.title || 'Notificación de Flota';
  const notificationOptions = {
    body: payload.data.body || '',
    icon: 'https://cdn-icons-png.flaticon.com/512/192/192162.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/192/192162.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
