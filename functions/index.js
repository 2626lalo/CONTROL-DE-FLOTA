/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Configuración global
setGlobalOptions({ 
  maxInstances: 10,
  region: "europe-west1" 
});

// Notificar a los administradores cuando se registra un nuevo usuario
exports.onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const user = snap.data();
    
    // Buscar tokens de usuarios con rol ADMIN
    const adminUsersSnapshot = await db.collection('users').where('role', '==', 'ADMIN').get();
    
    // Aquí iría la lógica de notificación
    console.log('Nuevo usuario creado:', user.email);
    return null;
  });

// Función de ejemplo
exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});
