import React, { createContext, useContext, useEffect, useState } from 'react';
import { Vehicle, User, ServiceRequest, Checklist, AuditLog, ServiceStage, VehicleStatus } from '../types';

// DETECTAR SI ESTAMOS EN PRODUCCIÓN POR VARIABLE DE ENTORNO
const IS_PRODUCTION = window.location.hostname.includes('run.app');

// MOCKS PARA DESARROLLO EN GOOGLE STUDIO
const MOCK_VEHICLES: Vehicle[] = [
  { plate: "ABC123", make: "TOYOTA", model: "HILUX", year: 2020, status: VehicleStatus.ACTIVE, ownership: "PROPIO" as any, fuelType: "DIESEL" as any, transmission: "MANUAL" as any, currentKm: 50000, images: { list: [] }, documents: [], serviceIntervalKm: 10000, nextServiceKm: 60000, vin: 'S/N', motorNum: 'S/N', type: 'Pickup', version: 'SRX', costCenter: 'CENTRAL', province: 'Mendoza' },
  { plate: "DEF456", make: "FORD", model: "RANGER", year: 2021, status: VehicleStatus.ACTIVE, ownership: "PROPIO" as any, fuelType: "DIESEL" as any, transmission: "MANUAL" as any, currentKm: 30000, images: { list: [] }, documents: [], serviceIntervalKm: 10000, nextServiceKm: 40000, vin: 'S/N', motorNum: 'S/N', type: 'Pickup', version: 'XLT', costCenter: 'OPERACIONES', province: 'Mendoza' }
];

const MOCK_USERS: User[] = [
  { id: "1", email: "alewilczek@gmail.com", nombre: "ALE", apellido: "WILCZEK", name: "ALE WILCZEK", telefono: "123456789", role: "administrador" as any, estado: "activo" as any, approved: true, fechaRegistro: new Date().toISOString(), intentosFallidos: 0, centroCosto: { id: "1", nombre: "CENTRAL", codigo: "001" }, level: 3, rolesSecundarios: [], notificaciones: { email: true, push: false, whatsapp: false }, creadoPor: "system", fechaCreacion: new Date().toISOString(), actualizadoPor: "system", fechaActualizacion: new Date().toISOString(), eliminado: false }
];

// ============================================
// VERSIÓN PARA DESARROLLO (LOCALSTORAGE)
// ============================================
const useLocalStorage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedVehicles = localStorage.getItem('fp_vehicles');
    const savedUsers = localStorage.getItem('fp_users');
    const savedRequests = localStorage.getItem('fp_requests');
    const savedChecklists = localStorage.getItem('fp_checklists');

    if (savedVehicles) setVehicles(JSON.parse(savedVehicles));
    else {
      setVehicles(MOCK_VEHICLES);
      localStorage.setItem('fp_vehicles', JSON.stringify(MOCK_VEHICLES));
    }

    if (savedUsers) setUsers(JSON.parse(savedUsers));
    else {
      setUsers(MOCK_USERS);
      localStorage.setItem('fp_users', JSON.stringify(MOCK_USERS));
    }

    if (savedRequests) setServiceRequests(JSON.parse(savedRequests));
    if (savedChecklists) setChecklists(JSON.parse(savedChecklists));

    setLoading(false);
  }, []);

  const addVehicle = async (vehicle: Vehicle) => {
    setVehicles(prev => {
      const newList = [...prev, vehicle];
      localStorage.setItem('fp_vehicles', JSON.stringify(newList));
      return newList;
    });
  };

  const updateVehicle = async (vehicle: Vehicle) => {
    setVehicles(prev => {
      const newList = prev.map(v => v.plate === vehicle.plate ? vehicle : v);
      localStorage.setItem('fp_vehicles', JSON.stringify(newList));
      return newList;
    });
  };

  const deleteVehicle = async (plate: string) => {
    setVehicles(prev => {
      const newList = prev.filter(v => v.plate !== plate);
      localStorage.setItem('fp_vehicles', JSON.stringify(newList));
      return newList;
    });
  };

  return { vehicles, users, serviceRequests, checklists, loading, error, addVehicle, updateVehicle, deleteVehicle };
};

// ============================================
// VERSIÓN PARA PRODUCCIÓN (FIREBASE)
// ============================================
const useFirebase = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!IS_PRODUCTION) return;
    
    let mounted = true;
    const loadFirebase = async () => {
      try {
        const { db } = await import('../firebase');
        const { collection, onSnapshot, query, orderBy } = await import('firebase/firestore');
        
        onSnapshot(collection(db, 'vehicles'), (snap) => {
          if (mounted) setVehicles(snap.docs.map(doc => ({ ...doc.data(), plate: doc.id })) as Vehicle[]);
        });

        onSnapshot(collection(db, 'users'), (snap) => {
          if (mounted) setUsers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as User[]);
        });

        onSnapshot(query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc')), (snap) => {
          if (mounted) setServiceRequests(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ServiceRequest[]);
        });

        onSnapshot(query(collection(db, 'checklists'), orderBy('date', 'desc')), (snap) => {
          if (mounted) setChecklists(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Checklist[]);
        });

      } catch (err) {
        console.error('Error cargando Firebase:', err);
        if (mounted) setError('Error al conectar con Firebase');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadFirebase();
    return () => { mounted = false; };
  }, []);

  const addVehicle = async (vehicle: Vehicle) => {
    try {
      const { db } = await import('../firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'vehicles', vehicle.plate), vehicle);
    } catch (err) {
      console.error('Error adding vehicle:', err);
    }
  };

  const updateVehicle = async (vehicle: Vehicle) => {
    try {
      const { db } = await import('../firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'vehicles', vehicle.plate), vehicle as any);
    } catch (err) {
      console.error('Error updating vehicle:', err);
    }
  };

  const deleteVehicle = async (plate: string) => {
    try {
      const { db } = await import('../firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'vehicles', plate));
    } catch (err) {
      console.error('Error deleting vehicle:', err);
    }
  };

  return { vehicles, users, serviceRequests, checklists, loading, error, addVehicle, updateVehicle, deleteVehicle };
};

// ============================================
// CONTEXTO PRINCIPAL
// ============================================
interface FleetContextType {
  vehicles: Vehicle[];
  users: User[];
  serviceRequests: ServiceRequest[];
  checklists: Checklist[];
  addVehicle: (v: Vehicle) => Promise<void>;
  updateVehicle: (v: Vehicle) => Promise<void>;
  deleteVehicle: (p: string) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addServiceRequest: (r: ServiceRequest) => Promise<void>;
  updateServiceRequest: (r: ServiceRequest) => Promise<void>;
  updateServiceStage: (serviceId: string, stage: ServiceStage, comment: string) => Promise<void>;
  addChecklist: (c: Checklist) => Promise<void>;
  loading: boolean;
  isDataLoading: boolean;
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
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const localStorageImpl = useLocalStorage();
  const firebaseImpl = useFirebase();
  
  const impl = IS_PRODUCTION ? firebaseImpl : localStorageImpl;
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [masterFindingsImage, setMasterFindingsImageState] = useState<string | null>(null);

  // EFECTO DE AUTENTICACIÓN: Solo Firebase maneja persistencia automática
  useEffect(() => {
    if (IS_PRODUCTION) {
      const loadAuth = async () => {
        const { auth } = await import('../firebase');
        const { onAuthStateChanged } = await import('firebase/auth');
        onAuthStateChanged(auth, (user) => {
          if (user) {
            const found = impl.users.find(u => u.email === user.email);
            setAuthenticatedUser(found || null);
          } else {
            setAuthenticatedUser(null);
          }
        });
      };
      loadAuth();
    }
    // En desarrollo local, authenticatedUser se inicializa en null 
    // y solo cambia mediante la función login()
  }, [impl.users]);

  const addUser = async (user: User) => {};
  const updateUser = async (user: User) => {};
  const deleteUser = async (id: string) => {};
  const addServiceRequest = async (req: ServiceRequest) => {};
  const updateServiceRequest = async (req: ServiceRequest) => {};
  const updateServiceStage = async (id: string, stage: ServiceStage, comment: string) => {};
  const addChecklist = async (checklist: Checklist) => {};
  
  const login = async (email: string, pass: string) => {
    const emailLower = email.toLowerCase().trim();
    
    if (!IS_PRODUCTION) {
      // Lógica de login Mock: Validar contra MOCK_USERS o impl.users
      const found = impl.users.find(u => u.email.toLowerCase() === emailLower);
      if (found && (pass === 'Joaquin4' || pass === 'admin')) {
        setAuthenticatedUser(found);
        return { success: true };
      }
      return { success: false, message: "Credenciales de desarrollo incorrectas." };
    }

    const { auth } = await import('../firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    try {
      await signInWithEmailAndPassword(auth, emailLower, pass);
      // setAuthenticatedUser se manejará en el onAuthStateChanged
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const logout = async () => {
    if (IS_PRODUCTION) {
      const { auth } = await import('../firebase');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    }
    setAuthenticatedUser(null);
  };

  const register = async (email: string, pass: string, name: string, phone: string) => true;

  const addNotification = (message: string, type: any = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const impersonate = (userId: string | null) => {
    if (!userId) setImpersonatedUser(null);
    else setImpersonatedUser(impl.users.find(u => u.id === userId) || null);
  };

  const value: FleetContextType = {
    ...impl,
    addUser, updateUser, deleteUser,
    addServiceRequest, updateServiceRequest, updateServiceStage,
    addChecklist,
    user: impersonatedUser || authenticatedUser,
    authenticatedUser,
    impersonatedUser,
    registeredUsers: impl.users,
    isDataLoading: impl.loading,
    isOnline: true,
    auditLogs: [],
    notifications,
    login, logout, register,
    addNotification,
    refreshData: async () => {},
    logAudit: async () => {},
    impersonate,
    masterFindingsImage,
    setMasterFindingsImage: async (img) => setMasterFindingsImageState(img),
    deleteDocument: async () => {},
    vehicleVersions: ["SRX PACK 4X4 AT", "EXTREME V6 AT", "LIMITED V6 4X4"],
    documentTypes: ['CEDULA', 'TITULO', 'VTV', 'SEGURO']
  };

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) throw new Error('useFleet must be used within FleetProvider');
  return context;
};

export const useApp = useFleet;
