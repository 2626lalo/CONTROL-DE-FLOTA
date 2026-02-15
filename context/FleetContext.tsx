import React, { createContext, useContext, useEffect, useState } from 'react';
import { Vehicle, User, ServiceRequest, Checklist, AuditLog, ServiceStage, VehicleStatus, UserRole, BienDeUso } from '../types';
import { useFirebase } from './FirebaseContext';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDoc,
  updateDoc
} from 'firebase/firestore';

const MASTER_EMAIL = 'alewilczek@gmail.com';

interface FleetContextType {
  vehicles: Vehicle[];
  users: User[];
  serviceRequests: ServiceRequest[];
  checklists: Checklist[];
  bienesDeUso: BienDeUso[];
  costCenters: string[]; 
  addVehicle: (v: Vehicle) => Promise<void>;
  updateVehicle: (v: Vehicle) => Promise<void>;
  bulkUpsertVehicles: (vs: Vehicle[]) => Promise<void>;
  deleteVehicle: (p: string) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addCostCenter: (name: string) => void;
  removeCostCenter: (name: string) => void;
  addServiceRequest: (r: ServiceRequest) => Promise<void>;
  updateServiceRequest: (r: ServiceRequest) => Promise<void>;
  updateServiceStage: (serviceId: string, stage: ServiceStage, comment: string) => Promise<void>;
  addChecklist: (c: Checklist) => Promise<void>;
  bulkUpsertBienes: (bs: BienDeUso[]) => Promise<void>;
  deleteBien: (id: string) => Promise<void>;
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
  register: (email: string, pass: string, name: string, lastName: string, phone: string) => Promise<{success: boolean, message?: string}>;
  requestPasswordReset: (email: string) => Promise<{success: boolean, message?: string}>;
  // FIX: Updated type to include 'info' as a valid notification level
  addNotification: (message: string, type?: 'error' | 'success' | 'warning' | 'info') => void;
  refreshData: () => Promise<void>;
  logAudit: (action: string, type: AuditLog['entityType'], id: string, details: string) => Promise<void>;
  impersonate: (userId: string | null) => void;
  masterFindingsImage: string | null;
  setMasterFindingsImage: (img: string | null) => Promise<void>;
  deleteDocument: (plate: string, docId: string) => Promise<void>;
  vehicleVersions: string[];
  documentTypes: string[];
  addDocumentType: (type: string) => void;
  lastBulkLoadDate: string | null;
  restoreGoldenMaster: () => Promise<void>;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: firebaseUser, db, logout: fbLogout } = useFirebase();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [costCenters, setCostCenters] = useState<string[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [bienesDeUso, setBienesDeUso] = useState<BienDeUso[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [masterFindingsImage, setMasterFindingsImageState] = useState<string | null>(null);
  const [docTypes, setDocTypes] = useState<string[]>(['CEDULA', 'TITULO', 'VTV', 'SEGURO']);
  const [lastBulkLoadDate, setLastBulkLoadDate] = useState<string | null>(localStorage.getItem('fp_last_bulk_load'));

  useEffect(() => {
    if (!firebaseUser) {
        setLoading(false);
        setAuthenticatedUser(null);
        setImpersonatedUser(null);
        return;
    }
    
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const us = snap.docs.map(d => ({ ...d.data(), id: d.id } as User));
      setUsers(us);
      const current = us.find(u => u.id === firebaseUser.uid);
      if (current) setAuthenticatedUser(current);
    });

    const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snap) => {
      setVehicles(snap.docs.map(d => d.data() as Vehicle));
    });

    const unsubBienes = onSnapshot(collection(db, 'bienes'), (snap) => {
      setBienesDeUso(snap.docs.map(d => d.data() as BienDeUso));
    });

    const unsubChecklists = onSnapshot(collection(db, 'checklists'), (snap) => {
      setChecklists(snap.docs.map(d => d.data() as Checklist));
    });

    const unsubRequests = onSnapshot(collection(db, 'requests'), (snap) => {
      setServiceRequests(snap.docs.map(d => d.data() as ServiceRequest));
    });

    setLoading(false);
    return () => {
      unsubVehicles(); unsubUsers(); unsubBienes(); unsubChecklists(); unsubRequests();
    };
  }, [firebaseUser, db]);

  // FUNCIÓN DE IMPERSONACIÓN MAESTRA
  const impersonate = (userId: string | null) => {
    if (!userId) {
      setImpersonatedUser(null);
      addNotification("Regresando a vista de Administrador Maestro", "info");
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    if (targetUser) {
      setImpersonatedUser(targetUser);
      addNotification(`Auditando sistema como: ${targetUser.nombre}`, "warning");
    }
  };

  const addVehicle = async (vehicle: Vehicle) => {
    if (firebaseUser) await setDoc(doc(db, 'vehicles', vehicle.plate), vehicle);
  };

  const updateVehicle = async (vehicle: Vehicle) => {
    if (firebaseUser) await setDoc(doc(db, 'vehicles', vehicle.plate), vehicle);
  };

  const deleteVehicle = async (plate: string) => {
    if (firebaseUser) await deleteDoc(doc(db, 'vehicles', plate));
  };

  const updateUser = async (u: User) => {
    if (firebaseUser) {
      await setDoc(doc(db, 'users', u.id), u, { merge: true });
    }
  };

  const deleteUser = async (id: string) => {
    if (firebaseUser) {
      await deleteDoc(doc(db, 'users', id));
    }
  };

  const logout = async () => {
    setAuthenticatedUser(null);
    setImpersonatedUser(null);
    if (firebaseUser) await fbLogout();
  };

  const addNotification = (message: string, type: any = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const value: FleetContextType = {
    vehicles, users, serviceRequests, checklists, bienesDeUso, costCenters: [],
    addVehicle, updateVehicle, bulkUpsertVehicles: async () => {}, deleteVehicle,
    addUser: async () => {}, updateUser, deleteUser,
    addCostCenter: () => {}, removeCostCenter: () => {},
    addServiceRequest: async (r) => { if (firebaseUser) await setDoc(doc(db, 'requests', r.id), r); },
    updateServiceRequest: async (r) => { if (firebaseUser) await setDoc(doc(db, 'requests', r.id), r); },
    updateServiceStage: async (id, stage, comment) => {
        const found = serviceRequests.find(r => r.id === id);
        if (!found) return;
        const updated = {
            ...found, stage,
            history: [...(found.history || []), { id: Date.now().toString(), date: new Date().toISOString(), userId: authenticatedUser?.id || 'sys', userName: authenticatedUser?.nombre || 'Sist', toStage: stage, comment }]
        };
        if (firebaseUser) await setDoc(doc(db, 'requests', id), updated);
    },
    addChecklist: async (c) => { if (firebaseUser) await setDoc(doc(db, 'checklists', c.id), c); },
    bulkUpsertBienes: async (bs) => {
        const batch = writeBatch(db);
        bs.forEach(b => batch.set(doc(db, 'bienes', b.id), b));
        await batch.commit();
    },
    deleteBien: async (id) => { if (firebaseUser) await deleteDoc(doc(db, 'bienes', id)); },
    loading, isDataLoading: loading, error: null, 
    user: impersonatedUser || authenticatedUser, // Prioridad al impersonado
    authenticatedUser, 
    impersonatedUser, 
    registeredUsers: users, isOnline: true, auditLogs: [],
    notifications, login: async () => ({success: false}), logout, register: async () => ({success: false}),
    requestPasswordReset: async () => ({success: false}), addNotification,
    refreshData: async () => {}, logAudit: async () => {}, impersonate,
    masterFindingsImage, setMasterFindingsImage: async (img) => setMasterFindingsImageState(img),
    deleteDocument: async (plate, docId) => {
      const v = vehicles.find(x => x.plate === plate);
      if (v) {
        const updated = { ...v, documents: (v.documents || []).filter(d => d.id !== docId) };
        if (firebaseUser) await setDoc(doc(db, 'vehicles', plate), updated);
      }
    },
    vehicleVersions: ["SRX PACK 4X4 AT", "EXTREME V6 AT", "LIMITED V6 4X4", "PRO-4X 4X4 AT", "FURGON 4325 XL", "Z.E. ELECTRIC 2A"],
    documentTypes: docTypes, addDocumentType: () => {},
    lastBulkLoadDate, restoreGoldenMaster: async () => {}
  };

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) throw new Error('useFleet debe usarse dentro de FleetProvider');
  return context;
};

export const useApp = useFleet;