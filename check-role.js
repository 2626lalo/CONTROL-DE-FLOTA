import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function checkUser() {
  const userRef = doc(db, 'users', 'alewilczek@gmail.com');
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    console.log('✅ Usuario encontrado en Firestore');
    console.log('Datos:', userSnap.data());
    console.log('Role:', userSnap.data().role);
  } else {
    console.log('❌ Usuario NO encontrado en Firestore');
  }
}

checkUser();
