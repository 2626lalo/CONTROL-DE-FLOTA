
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
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
  uploadImage: (file: File, path: string) => Promise<string>;
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

  useEffect(() => {
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
    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, additionalData: any) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const data = {
      ...additionalData,
      email,
      id: userCredential.user.uid,
      createdAt: new Date().toISOString(),
      role: 'USER',
      approved: false
    };
    await setDoc(doc(db, 'users', userCredential.user.uid), data);
    return userCredential;
  };

  const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

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
    uploadImage,
    db,
    storage
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
