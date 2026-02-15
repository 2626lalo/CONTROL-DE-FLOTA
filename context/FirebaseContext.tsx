import React, { createContext, useContext, useState, useEffect } from 'react';
// FIX: Updated imports to use @firebase/auth and marked User as a type-only import to resolve reported missing member errors
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from '@firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebaseConfig';
import { compressFileToBlob } from '../utils/imageCompressor';

interface FirebaseContextType {
  user: FirebaseUser | null;
  userData: any | null;
  loading: boolean;
  signUp: (email: string, pass: string, data: any) => Promise<any>;
  signIn: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  uploadImage: (file: File, path: string) => Promise<string>;
  // FIX: Added isOnline property to the context type
  isOnline: boolean;
  db: any;
  storage: any;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase debe usarse dentro de FirebaseProvider');
  return context;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  // FIX: Implemented real-time online status detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        setUserData(docSnap.exists() ? docSnap.data() : null);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, additionalData: any) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const data = {
      id: userCredential.user.uid,
      email: email.toLowerCase().trim(),
      nombre: additionalData.nombre.toUpperCase(),
      apellido: additionalData.apellido.toUpperCase(),
      name: `${additionalData.nombre} ${additionalData.apellido}`.toUpperCase(),
      role: 'USER',
      approved: false, 
      estado: 'pendiente',
      fechaRegistro: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      centroCosto: { id: "0", nombre: "PENDIENTE", codigo: "000" },
      costCenter: "PENDIENTE",
      level: 1,
      eliminado: false
    };
    // IMPORTANTE: El password NUNCA se guarda en Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), data);
    return userCredential;
  };

  const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);
  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

  const uploadImage = async (file: File, path: string) => {
    try {
      const compressedBlob = await compressFileToBlob(file);
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, compressedBlob);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      throw error;
    }
  };

  const value = {
    user,
    userData,
    loading,
    signUp,
    signIn,
    logout,
    resetPassword,
    uploadImage,
    isOnline,
    db,
    storage
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};