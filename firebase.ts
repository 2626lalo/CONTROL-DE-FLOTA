
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyATwUM-hsCuCa5d1qR2CifxKuMivIpmuUY",
  authDomain: "control-de-flota-firebase.firebaseapp.com",
  projectId: "control-de-flota-firebase",
  storageBucket: "control-de-flota-firebase.firebasestorage.app",
  messagingSenderId: "823480319253",
  appId: "1:823480319253:web:1f88eb683e3b5981953d1c",
  measurementId: "G-J3M8CMMWZ4"
};

const app = initializeApp(firebaseConfig);

// Exportar servicios inicializados para uso dinámico
export const db = getFirestore(app);
export const auth = getAuth(app);
