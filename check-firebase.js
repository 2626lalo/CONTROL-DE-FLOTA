import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCyrUJWjWfpBYLT0T9aolvC_ui2qh_vC_A",
  authDomain: "control-de-flota-pro.firebaseapp.com",
  projectId: "control-de-flota-pro",
  storageBucket: "control-de-flota-pro.firebasestorage.app",
  messagingSenderId: "194939883399",
  appId: "1:194939883399:web:c20923d4f57dc5167d8d22"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function checkFirebase() {
  try {
    // Primero, iniciar sesión (reemplazar con tu contraseña)
    await signInWithEmailAndPassword(auth, 'alewilczek@gmail.com', 'Joaquin4');
    console.log('✅ Login exitoso');

    // Verificar vehículos
    const vehiclesRef = collection(db, 'vehicles');
    const vehiclesSnap = await getDocs(vehiclesRef);
    console.log(`📊 Vehículos en Firestore: ${vehiclesSnap.size}`);
    
    // Verificar usuarios
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    console.log(`📊 Usuarios en Firestore: ${usersSnap.size}`);
    
    // Mostrar algunos datos
    if (vehiclesSnap.size > 0) {
      console.log('\nEjemplo de vehículo:');
      vehiclesSnap.forEach(doc => {
        console.log('  -', doc.id, ':', doc.data().marca, doc.data().modelo);
      });
    }
    
    if (usersSnap.size > 0) {
      console.log('\nEjemplo de usuario:');
      usersSnap.forEach(doc => {
        console.log('  -', doc.id, ':', doc.data().email, doc.data().role);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.code, error.message);
  }
}

checkFirebase();
