import React, { useEffect } from 'react';
import { requestNotificationPermission, onMessageListener } from '../firebaseMessaging';

export const NotificationHandler: React.FC = () => {
  useEffect(() => {
    // Solicitar permisos al cargar la app
    requestNotificationPermission();
    
    // Configurar listener para mensajes en primer plano
    const unsubscribe = onMessageListener().then((payload: any) => {
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

    return () => {
      // Logic for cleanup if onMessageListener returned a specific unsubscriber
    };
  }, []);

  return null; // Este componente no renderiza nada
};
