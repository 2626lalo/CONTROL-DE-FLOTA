import { getMessaging, getToken } from 'firebase/messaging';

const vapidKey = 'BErks0l9WXyqOqE5gVd5aR0q0Xv1K8V2W6g5z7l9K4k0l8v2L6m8n2B4r6t8y2u6x0';

export const getFCMToken = async () => {
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.error('Error obteniendo token FCM:', error);
    return null;
  }
};
