import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCyrUJWjWfpBYLT0T9aolvC_ui2qh_vC_A",
  authDomain: "control-de-flota-pro.firebaseapp.com",
  projectId: "control-de-flota-pro",
  storageBucket: "control-de-flota-pro.firebasestorage.app",
  messagingSenderId: "194939883399",
  appId: "1:194939883399:web:c20923d4f57dc5167d8d22"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones de escritorio');
    return;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BErks0l9WXyqOqE5gVd5aR0q0Xv1K8V2W6g5z7l9K4k0l8v2L6m8n2B4r6t8y2u6x0'
      });
      console.log('Token FCM:', token);
      return token;
    }
  } catch (error) {
    console.error('Error al obtener permiso de notificaciones:', error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
