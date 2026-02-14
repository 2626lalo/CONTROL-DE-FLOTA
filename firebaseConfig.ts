
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCyrUJWjWfpBYLT0T9aolvC_ui2qh_vC_A",
  authDomain: "control-de-flota-pro.firebaseapp.com",
  projectId: "control-de-flota-pro",
  storageBucket: "control-de-flota-pro.firebasestorage.app",
  messagingSenderId: "194939883399",
  appId: "1:194939883399:web:c20923d4f57dc5167d8d22"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
