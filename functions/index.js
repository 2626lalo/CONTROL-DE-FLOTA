const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Notificar a los administradores cuando se registra un nuevo usuario
exports.onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const user = snap.data();
    
    // Buscar tokens de usuarios con rol ADMIN
    const adminUsersSnapshot = await db.collection('users').where('role', '==', 'ADMIN').get();
    const adminIds = adminUsersSnapshot.docs.map(doc => doc.id);
    
    if (adminIds.length === 0) return;

    const tokensPromises = adminIds.map(id => db.collection('fcmTokens').doc(id).get());
    const tokensSnapshots = await Promise.all(tokensPromises);
    const tokens = tokensSnapshots
      .filter(snap => snap.exists)
      .map(snap => snap.data().token);
    
    if (tokens.length === 0) return;
    
    const payload = {
      notification: {
        title: 'Nuevo usuario registrado',
        body: `${user.nombre || 'Un nuevo usuario'} solicita acceso al sistema.`,
        icon: 'https://cdn-icons-png.flaticon.com/512/192/192162.png'
      },
      data: {
        type: 'new_user',
        userId: context.params.userId
      }
    };
    
    return admin.messaging().sendEachForMulticast({
      tokens,
      ...payload
    });
  });

// Notificar al usuario cuando su cuenta es aprobada
exports.onUserApproved = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (!before.approved && after.approved) {
      const tokenDoc = await db.collection('fcmTokens').doc(context.params.userId).get();
      const token = tokenDoc.data()?.token;
      
      if (!token) return;
      
      const payload = {
        notification: {
          title: 'Cuenta autorizada',
          body: 'Tu acceso a FleetPro ha sido aprobado. Ya puedes ingresar.',
          icon: 'https://cdn-icons-png.flaticon.com/512/192/192162.png'
        }
      };
      
      return admin.messaging().send({
        token,
        ...payload
      });
    }
  });

// Recordatorio diario de checklist pendiente
exports.checkPendingChecklists = functions.pubsub
  .schedule('0 10 * * *') 
  .timeZone('America/Argentina/Buenos_Aires')
  .onRun(async (context) => {
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    
    const checklistsHoy = await db.collection('checklistsConductores')
      .where('fecha', '>=', hoy.toISOString())
      .get();
    
    const conductoresConChecklist = new Set(
      checklistsHoy.docs.map(doc => doc.data().conductorId)
    );
    
    const conductoresSnapshot = await db.collection('users')
      .where('role', 'in', ['USER', 'CONDUCTOR'])
      .get();
    
    const tokensPromises = [];
    
    conductoresSnapshot.docs.forEach(doc => {
      const conductor = doc.data();
      if (!conductoresConChecklist.has(conductor.id)) {
        tokensPromises.push(
          db.collection('fcmTokens').doc(conductor.id).get()
        );
      }
    });
    
    const tokensSnapshots = await Promise.all(tokensPromises);
    const tokens = tokensSnapshots
      .filter(snap => snap.exists)
      .map(snap => snap.data().token);
    
    if (tokens.length === 0) return;
    
    const payload = {
      notification: {
        title: 'Checklist Diario Pendiente',
        body: 'Aún no has completado tu inspección de hoy. Por favor, realízala ahora.',
        icon: 'https://cdn-icons-png.flaticon.com/512/192/192162.png'
      }
    };
    
    return admin.messaging().sendEachForMulticast({
      tokens,
      ...payload
    });
  });
