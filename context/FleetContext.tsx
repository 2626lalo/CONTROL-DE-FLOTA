
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Vehicle, User, ServiceRequest, Checklist, AuditLog, ServiceStage, UserRole } from '../types';

// DATOS MOCK PARA DESARROLLO EN GOOGLE STUDIO
const MOCK_VEHICLES: Vehicle[] = [
  { plate: "ABC123", make: "TOYOTA", model: "HILUX", year: 2020, status: "ACTIVO", currentKm: 45000, images: { list: [] }, documents: [] } as any,
  { plate: "DEF456", make: "FORD", model: "RANGER", year: 2021, status: "ACTIVO", currentKm: 12000, images: { list: [] }, documents: [] } as any,
];

const MOCK_USERS: User[] = [
  { id: "1", email: "alewilczek@gmail.com", nombre: "ALE", apellido: "WILCZEK", role: UserRole.ADMIN, approved: true, estado: 'activo' } as any,
];

interface FleetContextType {
  vehicles: Vehicle[];
  users: User[];
  serviceRequests: ServiceRequest[];
  checklists: Checklist[];
  addVehicle: (v: Vehicle) => Promise<void>;
  updateVehicle: (v: Vehicle) => Promise<void>;
  deleteVehicle: (p: string) => Promise<void>;
  addUser: (u: User) => Promise<void>;
  updateUser: (u: User) => Promise<void>;
  addServiceRequest: (r: ServiceRequest) => Promise<void>;
  updateServiceRequest: (r: ServiceRequest) => Promise<void>;
  addChecklist: (c: Checklist) => Promise<void>;
  loading: boolean;
  isDataLoading: boolean; // Alias para compatibilidad
  error: string | null;
  user: User | null;
  authenticatedUser: User | null;
  impersonatedUser: User | null;
  registeredUsers: User[];
  isOnline: boolean;
  auditLogs: AuditLog[];
  notifications: any[];
  login: (email: string, pass: string) => Promise<{success: boolean, message?: string}>;
  logout: () => Promise<void>;
  register: (email: string, pass: string, name: string, phone: string) => Promise<boolean>;
  addNotification: (message: string, type?: 'error' | 'success' | 'warning') => void;
  refreshData: () => Promise<void>;
  logAudit: (action: string, type: AuditLog['entityType'], id: string, details: string) => Promise<void>;
  impersonate: (userId: string | null) => void;
  masterFindingsImage: string | null;
  setMasterFindingsImage: (img: string | null) => Promise<void>;
  deleteDocument: (plate: string, docId: string) => Promise<void>;
  vehicleVersions: string[];
  documentTypes: string[];
  updateServiceStage: (serviceId: string, stage: ServiceStage, comment: string) => Promise<void>;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProduction, setIsProduction] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [masterFindingsImage, setMasterFindingsImageState] = useState<string | null>(null);

  const vehicleVersions = ["SRX PACK 4X4 AT", "EXTREME V6 AT", "LIMITED V6 4X4", "PRO-4X 4X4 AT", "FURGON 4325 XL", "Z.E. ELECTRIC 2A"];
  const documentTypes = ['CEDULA', 'TITULO', 'VTV', 'SEGURO', 'RUTA', 'SENASA'];

  useEffect(() => {
    const initEnvironment = async () => {
      if (window.location.hostname.includes('run.app')) {
        setIsProduction(true);
        try {
          const { db, auth } = await import('../firebase');
          const { collection, onSnapshot, query, orderBy, doc, getDoc } = await import('firebase/firestore');
          const { onAuthStateChanged } = await import('firebase/auth');

          onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              if (userDoc.exists()) {
                setAuthenticatedUser(userDoc.data() as User);
              }
            } else {
              setAuthenticatedUser(null);
            }
          });

          onSnapshot(collection(db, 'vehicles'), (snap) => setVehicles(snap.docs.map(d => ({ ...d.data(), plate: d.id })) as any));
          onSnapshot(collection(db, 'users'), (snap) => setUsers(snap.docs.map(d => ({ ...d.data(), id: d.id })) as any));
          onSnapshot(query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc')), (snap) => setServiceRequests(snap.docs.map(d => ({ ...d.data(), id: d.id })) as any));
          onSnapshot(query(collection(db, 'checklists'), orderBy('date', 'desc')), (snap) => setChecklists(snap.docs.map(d => ({ ...d.data(), id: d.id })) as any));
          
        } catch (err) {
          console.error('Error cargando Firebase:', err);
          setError('Fallo de conexión con la nube');
          setVehicles(MOCK_VEHICLES);
          setUsers(MOCK_USERS);
        }
      } else {
        console.log('Modo Desarrollo: Cargando Datos Mock');
        setVehicles(MOCK_VEHICLES);
        setUsers(MOCK_USERS);
        setAuthenticatedUser(MOCK_USERS[0]);
      }
      setLoading(false);
    };
    
    initEnvironment();
  }, []);

  const addVehicle = async (vehicle: Vehicle) => {
    if (isProduction) {
      const { db } = await import('../firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'vehicles', vehicle.plate), vehicle);
    } else {
      setVehicles(prev => [...prev, vehicle]);
    }
  };

  const updateVehicle = async (vehicle: Vehicle) => {
    if (isProduction) {
      const { db } = await import('../firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'vehicles', vehicle.plate), vehicle as any);
    } else {
      setVehicles(prev => prev.map(v => v.plate === vehicle.plate ? vehicle : v));
    }
  };

  const deleteVehicle = async (plate: string) => {
    if (isProduction) {
      const { db } = await import('../firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'vehicles', plate));
    } else {
      setVehicles(prev => prev.filter(v => v.plate !== plate));
    }
  };

  const addUser = async (user: User) => {
    if (isProduction) {
        const { db } = await import('../firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'users', user.id), user);
    }
    setUsers(prev => [...prev, user]);
  };

  const updateUser = async (user: User) => {
    if (isProduction) {
        const { db } = await import('../firebase');
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'users', user.id), user as any);
    }
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
  };

  const addServiceRequest = async (req: ServiceRequest) => {
    if (isProduction) {
        const { db } = await import('../firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'serviceRequests', req.id), req);
    }
    setServiceRequests(prev => [req, ...prev]);
  };

  const updateServiceRequest = async (req: ServiceRequest) => {
    if (isProduction) {
        const { db } = await import('../firebase');
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'serviceRequests', req.id), req as any);
    }
    setServiceRequests(prev => prev.map(r => r.id === req.id ? req : r));
  };

  const updateServiceStage = async (id: string, stage: ServiceStage, comment: string) => {
    const req = serviceRequests.find(s => s.id === id);
    if (!req) return;
    const historyItem = { id: `H-${Date.now()}`, date: new Date().toISOString(), userId: authenticatedUser?.id || 'sys', userName: authenticatedUser?.nombre || 'Admin', fromStage: req.stage, toStage: stage, comment };
    const updated = { ...req, stage, history: [...(req.history || []), historyItem] };
    await updateServiceRequest(updated);
  };

  const addChecklist = async (checklist: Checklist) => {
    if (isProduction) {
        const { db } = await import('../firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'checklists', checklist.id), checklist);
    }
    setChecklists(prev => [checklist, ...prev]);
  };

  const login = async (email: string, pass: string) => {
    if (!isProduction) return { success: true };
    const { auth } = await import('../firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const logout = async () => {
    if (isProduction) {
      const { auth } = await import('../firebase');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    }
    setAuthenticatedUser(null);
  };

  const register = async (email: string, pass: string, name: string, phone: string) => {
    if (!isProduction) return true;
    try {
        const { auth, db } = await import('../firebase');
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const { doc, setDoc } = await import('firebase/firestore');
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, 'users', res.user.uid), { id: res.user.uid, email, nombre: name, telefono: phone, role: UserRole.USER, approved: false });
        return true;
    } catch { return false; }
  };

  const impersonate = (id: string | null) => {
    if (!id) setImpersonatedUser(null);
    else setImpersonatedUser(users.find(u => u.id === id) || null);
  };

  const addNotification = (message: string, type: any = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const value: FleetContextType = {
    vehicles, users, serviceRequests, checklists,
    addVehicle, updateVehicle, deleteVehicle,
    addUser, updateUser,
    addServiceRequest, updateServiceRequest, updateServiceStage,
    addChecklist,
    loading, isDataLoading: loading, error,
    user: impersonatedUser || authenticatedUser,
    authenticatedUser, impersonatedUser,
    registeredUsers: users, isOnline: navigator.onLine,
    auditLogs, notifications, login, logout, register,
    addNotification, refreshData: async () => {}, logAudit: async () => {},
    impersonate, masterFindingsImage, setMasterFindingsImage: async (img) => setMasterFindingsImageState(img),
    deleteDocument: async () => {}, vehicleVersions, documentTypes
  };

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) throw new Error('useFleet must be used within FleetProvider');
  return context;
};

export const useApp = useFleet;
