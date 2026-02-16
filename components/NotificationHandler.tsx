import React, { useEffect } from 'react';
import { requestNotificationPermission, onMessageListener } from '../firebaseMessaging';
import { getFCMToken } from '../notificationService';
import { useFirebase } from '../context/FirebaseContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const NotificationHandler: React.FC = () => {
  const { user } = useFirebase();

  useEffect(() => {
    // Solicitar permisos al cargar la app
    requestNotificationPermission();
    
    // Configurar listener para mensajes en primer plano
    const unsubscribeMessage = onMessageListener().then((payload: any) => {
      console.log('Notificación recibida en foreground:', payload);
      
      if (payload?.notification) {
        // Mostrar notificación nativa si la app está abierta
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: 'https://cdn-icons-png.flaticon.com/512/192/192162.png'
        });
      }
    }).catch(err => {
      console.error('Error configurando listener de mensajes:', err);
    });

    const initNotifications = async () => {
      if (user) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getFCMToken();
          if (token) {
            // Guardar token en Firestore asociado al usuario
            await setDoc(doc(db, 'fcmTokens', user.uid), {
              token,
              userId: user.uid,
              updatedAt: new Date().toISOString()
            }, { merge: true });
            console.log('Token FCM sincronizado para usuario:', user.uid);
          }
        }
      }
    };
    
    initNotifications();

    return () => {
      // Cleanup logic
    };
  }, [user]);

  return null; // Este componente no renderiza nada
};
