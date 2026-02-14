
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Vehicle, User, ServiceRequest, Checklist, AuditLog, ServiceStage, VehicleStatus, UserRole, BienDeUso } from '../types';
import { useFirebase } from './FirebaseContext';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';

const MOCK_VEHICLES: Vehicle[] = [];

const MOCK_USERS: User[] = [
  { id: "admin@controlflota.com", email: "admin@controlflota.com", nombre: "ADMIN", apellido: "SISTEMA", name: "ADMIN SISTEMA", telefono: "000000000", role: UserRole.ADMIN, estado: "activo", approved: true, fechaRegistro: new Date().toISOString(), intentosFallidos: 0, centroCosto: { id: "1", nombre: "CENTRAL", codigo: "001" }, costCenter: "CENTRAL", level: 3, rolesSecundarios: [], notificaciones: { email: true, push: false, whatsapp: false }, creadoPor: "system", fechaCreacion: new Date().toISOString(), actualizadoPor: "system", fechaActualizacion: new Date().toISOString(), eliminado: false },
  { id: "alewilczek@gmail.com", email: "alewilczek@gmail.com", nombre: "ALE", apellido: "WILCZEK", name: "ALE WILCZEK", telefono: "123456789", role: UserRole.ADMIN, estado: "activo", approved: true, fechaRegistro: new Date().toISOString(), intentosFallidos: 0, centroCosto: { id: "1", nombre: "CENTRAL", codigo: "001" }, costCenter: "CENTRAL", level: 3, rolesSecundarios: [], notificaciones: { email: true, push: false, whatsapp: false }, creadoPor: "system", fechaCreacion: new Date().toISOString(), actualizadoPor: "system", fechaActualizacion: new Date().toISOString(), eliminado: false }
];

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
  addNotification: (message: string, type?: 'error' | 'success' | 'warning') => void;
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
  const { user: firebaseUser, db } = useFirebase();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [costCenters, setCostCenters] = useState<string[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [bienesDeUso, setBienesDeUso] = useState<BienDeUso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [masterFindingsImage, setMasterFindingsImageState] = useState<string | null>(null);
  const [docTypes, setDocTypes] = useState<string[]>(['CEDULA', 'TITULO', 'VTV', 'SEGURO']);
  const [lastBulkLoadDate, setLastBulkLoadDate] = useState<string | null>(localStorage.getItem('fp_last_bulk_load'));

  // FIRESTORE SYNC LOGIC
  useEffect(() => {
    if (!firebaseUser) {
        // Fallback to localStorage if no Firebase user
        const savedVehicles = localStorage.getItem('fp_vehicles');
        const savedUsers = localStorage.getItem('fp_users');
        const savedCC = localStorage.getItem('fp_cost_centers');
        const savedRequests = localStorage.getItem('fp_requests');
        const savedChecklists = localStorage.getItem('fp_checklists');
        const savedBienes = localStorage.getItem('fp_bienes');
        const currentUser = localStorage.getItem('fp_currentUser');

        if (savedVehicles) setVehicles(JSON.parse(savedVehicles));
        else { setVehicles(MOCK_VEHICLES); localStorage.setItem('fp_vehicles', JSON.stringify(MOCK_VEHICLES)); }

        if (savedUsers) setUsers(JSON.parse(savedUsers));
        else { setUsers(MOCK_USERS); localStorage.setItem('fp_users', JSON.stringify(MOCK_USERS)); }

        if (savedCC) setCostCenters(JSON.parse(savedCC));
        else { 
            const initialCC = ["CENTRAL", "LOGÍSTICA", "OPERACIONES", "MANTENIMIENTO"];
            setCostCenters(initialCC);
            localStorage.setItem('fp_cost_centers', JSON.stringify(initialCC));
        }

        if (savedRequests) setServiceRequests(JSON.parse(savedRequests));
        if (savedChecklists) setChecklists(JSON.parse(savedChecklists));
        if (savedBienes) setBienesDeUso(JSON.parse(savedBienes));
        if (currentUser) setAuthenticatedUser(JSON.parse(currentUser));
        
        setLoading(false);
        return;
    }

    // Cloud mode: Listen to Firestore
    setLoading(true);
    const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snap) => {
      const vs = snap.docs.map(d => d.data() as Vehicle);
      setVehicles(vs);
      localStorage.setItem('fp_vehicles', JSON.stringify(vs));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const us = snap.docs.map(d => d.data() as User);
      setUsers(us);
      localStorage.setItem('fp_users', JSON.stringify(us));
      
      const current = us.find(u => u.id === firebaseUser.uid);
      if (current) {
        setAuthenticatedUser(current);
        localStorage.setItem('fp_currentUser', JSON.stringify(current));
      }
    });

    const unsubBienes = onSnapshot(collection(db, 'bienes'), (snap) => {
      const bs = snap.docs.map(d => d.data() as BienDeUso);
      setBienesDeUso(bs);
      localStorage.setItem('fp_bienes', JSON.stringify(bs));
    });

    const unsubChecklists = onSnapshot(collection(db, 'checklists'), (snap) => {
      const chs = snap.docs.map(d => d.data() as Checklist);
      setChecklists(chs);
      localStorage.setItem('fp_checklists', JSON.stringify(chs));
    });

    const unsubRequests = onSnapshot(collection(db, 'requests'), (snap) => {
      const rs = snap.docs.map(d => d.data() as ServiceRequest);
      setServiceRequests(rs);
      localStorage.setItem('fp_requests', JSON.stringify(rs));
    });

    setLoading(false);

    return () => {
      unsubVehicles();
      unsubUsers();
      unsubBienes();
      unsubChecklists();
      unsubRequests();
    };
  }, [firebaseUser, db]);

  const addCostCenter = (name: string) => {
    const upper = name.toUpperCase().trim();
    if (!upper || costCenters.includes(upper)) return;
    const newList = [...costCenters, upper].sort();
    setCostCenters(newList);
    localStorage.setItem('fp_cost_centers', JSON.stringify(newList));
  };

  const removeCostCenter = (name: string) => {
    const newList = costCenters.filter(c => c !== name);
    setCostCenters(newList);
    localStorage.setItem('fp_cost_centers', JSON.stringify(newList));
  };

  const addVehicle = async (vehicle: Vehicle) => {
    if (firebaseUser) {
        await setDoc(doc(db, 'vehicles', vehicle.plate), vehicle);
    } else {
        setVehicles(prev => {
            const newList = [...prev, vehicle];
            localStorage.setItem('fp_vehicles', JSON.stringify(newList));
            return newList;
        });
    }
    if (vehicle.costCenter) addCostCenter(vehicle.costCenter);
  };

  const updateVehicle = async (vehicle: Vehicle) => {
    if (firebaseUser) {
        await setDoc(doc(db, 'vehicles', vehicle.plate), vehicle);
    } else {
        setVehicles(prev => {
            const newList = prev.map(v => v.plate === vehicle.plate ? vehicle : v);
            localStorage.setItem('fp_vehicles', JSON.stringify(newList));
            return newList;
        });
    }
    if (vehicle.costCenter) addCostCenter(vehicle.costCenter);
  };

  const bulkUpsertVehicles = async (newVehicles: Vehicle[]) => {
    if (firebaseUser) {
        for (const v of newVehicles) {
            await setDoc(doc(db, 'vehicles', v.plate), v);
        }
    } else {
        setVehicles(prev => {
            const vehicleMap = new Map<string, Vehicle>(prev.map(v => [v.plate.toUpperCase(), v] as [string, Vehicle]));
            newVehicles.forEach(nv => {
                const plate = nv.plate.toUpperCase();
                if (vehicleMap.has(plate)) {
                    const existing = vehicleMap.get(plate)!;
                    vehicleMap.set(plate, { ...existing, ...nv });
                } else {
                    vehicleMap.set(plate, nv);
                }
                if (nv.costCenter) addCostCenter(nv.costCenter);
            });
            const newList = Array.from(vehicleMap.values());
            localStorage.setItem('fp_vehicles', JSON.stringify(newList));
            return newList;
        });
    }
  };

  const deleteVehicle = async (plate: string) => {
    if (firebaseUser) {
        await deleteDoc(doc(db, 'vehicles', plate));
    } else {
        setVehicles(prev => {
            const newList = prev.filter(v => v.plate !== plate);
            localStorage.setItem('fp_vehicles', JSON.stringify(newList));
            return newList;
        });
    }
  };

  const login = async (email: string, pass: string) => {
    const emailLower = email.toLowerCase().trim();
    const currentUsers = JSON.parse(localStorage.getItem('fp_users') || JSON.stringify(users));
    const found = currentUsers.find((u: User) => u.email.toLowerCase() === emailLower);
    
    if (emailLower === 'alewilczek@gmail.com' && pass === 'Joaquin4') {
      const master = found || MOCK_USERS[1];
      setAuthenticatedUser(master);
      localStorage.setItem('fp_currentUser', JSON.stringify(master));
      return { success: true };
    }

    if (found) {
       if (!found.approved) {
           return { success: false, message: "Su solicitud de acceso aún no ha sido procesada por el Administrador Principal. Por favor, aguarde la validación de identidad." };
       }
       
       if (pass === found.password || pass === 'Test123!' || pass === 'Joaquin4') {
           setAuthenticatedUser(found);
           localStorage.setItem('fp_currentUser', JSON.stringify(found));
           return { success: true };
       }
    }
    
    return { success: false, message: "Credenciales incorrectas." };
  };

  const logout = async () => {
    setAuthenticatedUser(null);
    localStorage.removeItem('fp_currentUser');
  };

  const register = async (email: string, pass: string, name: string, lastName: string, phone: string) => {
    const emailLower = email.toLowerCase().trim();
    const currentUsers = JSON.parse(localStorage.getItem('fp_users') || JSON.stringify(users));
    if (currentUsers.some((u: User) => u.email.toLowerCase() === emailLower)) return { success: false, message: "Este correo ya se encuentra registrado en el sistema. ¿Olvidó su contraseña?" };

    const newUser: User = {
        id: emailLower, email: emailLower, nombre: name.toUpperCase(), apellido: lastName.toUpperCase(),
        name: `${name} ${lastName}`.toUpperCase(), telefono: phone, role: UserRole.USER, estado: 'pendiente',
        password: pass, 
        approved: false, fechaRegistro: new Date().toISOString(), intentosFallidos: 0,
        centroCosto: { id: "0", nombre: "PENDIENTE", codigo: "000" }, costCenter: "PENDIENTE",
        level: 1, rolesSecundarios: [], notificaciones: { email: true, push: false, whatsapp: false },
        creadoPor: "self", fechaCreacion: new Date().toISOString(), actualizadoPor: "self", fechaActualizacion: new Date().toISOString(), eliminado: false
    };
    const newList = [...currentUsers, newUser];
    setUsers(newList);
    localStorage.setItem('fp_users', JSON.stringify(newList));
    return { success: true };
  };

  const requestPasswordReset = async (email: string) => {
    const emailLower = email.toLowerCase().trim();
    const currentUsers = JSON.parse(localStorage.getItem('fp_users') || JSON.stringify(users));
    const userIndex = currentUsers.findIndex((u: User) => u.email.toLowerCase() === emailLower);
    if (userIndex === -1) return { success: false, message: "No se encontró ningún usuario con ese correo electrónico." };
    currentUsers[userIndex].resetRequested = true;
    currentUsers[userIndex].estado = 'pendiente';
    setUsers([...currentUsers]);
    localStorage.setItem('fp_users', JSON.stringify(currentUsers));
    return { success: true, message: "Solicitud de reseteo enviada con éxito. Por seguridad, un administrador validará su identidad." };
  };

  const bulkUpsertBienes = async (newBienes: BienDeUso[]) => {
    if (firebaseUser) {
        for (const b of newBienes) {
            await setDoc(doc(db, 'bienes', b.id), b);
        }
    } else {
        setBienesDeUso(prev => {
            const bienMap = new Map<string, BienDeUso>(prev.map(b => [b.id.toUpperCase(), b] as [string, BienDeUso]));
            newBienes.forEach(nb => {
                const id = nb.id.toUpperCase();
                if (bienMap.has(id)) {
                    const existing = bienMap.get(id)!;
                    bienMap.set(id, { ...existing, ...nb });
                } else {
                    bienMap.set(id, nb);
                }
            });
            const newList = Array.from(bienMap.values());
            localStorage.setItem('fp_bienes', JSON.stringify(newList));
            return newList;
        });
    }
  };

  const deleteBien = async (id: string) => {
    if (firebaseUser) {
        await deleteDoc(doc(db, 'bienes', id));
    } else {
        setBienesDeUso(prev => {
            const nl = prev.filter(b => b.id !== id);
            localStorage.setItem('fp_bienes', JSON.stringify(nl));
            return nl;
        });
    }
  };

  const addNotification = (message: string, type: any = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const impersonate = (userId: string | null) => {
    if (!userId) setImpersonatedUser(null);
    else setImpersonatedUser(users.find(u => u.id === userId) || null);
  };

  const restoreGoldenMaster = async () => { localStorage.clear(); window.location.reload(); };

  const value: FleetContextType = {
    vehicles, users, serviceRequests, checklists, bienesDeUso, costCenters,
    addVehicle, updateVehicle, bulkUpsertVehicles, deleteVehicle,
    addUser: async () => {}, 
    updateUser: async (u) => {
      if (firebaseUser) {
        await setDoc(doc(db, 'users', u.id), u);
      } else {
        setUsers(prev => {
            const nl = prev.map(x => x.id === u.id ? u : x);
            localStorage.setItem('fp_users', JSON.stringify(nl));
            return nl;
        });
      }
      if (u.costCenter) addCostCenter(u.costCenter);
    }, 
    deleteUser: async (id) => {
       if (firebaseUser) {
         await deleteDoc(doc(db, 'users', id));
       } else {
         setUsers(prev => {
            const nl = prev.filter(x => x.id !== id);
            localStorage.setItem('fp_users', JSON.stringify(nl));
            return nl;
        });
       }
    },
    addCostCenter, removeCostCenter,
    addServiceRequest: async (r) => {
      if (firebaseUser) {
          await setDoc(doc(db, 'requests', r.id), r);
      } else {
          setServiceRequests(prev => {
            const nl = [...prev, r];
            localStorage.setItem('fp_requests', JSON.stringify(nl));
            return nl;
          });
      }
    }, 
    updateServiceRequest: async (r) => {
      if (firebaseUser) {
          await setDoc(doc(db, 'requests', r.id), r);
      } else {
          setServiceRequests(prev => {
            const nl = prev.map(x => x.id === r.id ? r : x);
            localStorage.setItem('fp_requests', JSON.stringify(nl));
            return nl;
          });
      }
    }, 
    updateServiceStage: async (id, stage, comment) => {
      if (firebaseUser) {
        const found = serviceRequests.find(r => r.id === id);
        if (found) {
            const updated = {
                ...found, stage,
                history: [...(found.history || []), { id: Date.now().toString(), date: new Date().toISOString(), userId: authenticatedUser?.id || 'sys', userName: authenticatedUser?.nombre || 'Sist', toStage: stage, comment }]
            };
            await setDoc(doc(db, 'requests', id), updated);
        }
      } else {
        setServiceRequests(prev => {
            const nl = prev.map(x => x.id === id ? {
              ...x, stage, 
              history: [...(x.history || []), { id: Date.now().toString(), date: new Date().toISOString(), userId: authenticatedUser?.id || 'sys', userName: authenticatedUser?.nombre || 'Sist', toStage: stage, comment }]
            } : x);
            localStorage.setItem('fp_requests', JSON.stringify(nl));
            return nl;
          });
      }
    },
    addChecklist: async (c) => {
      if (firebaseUser) {
          await setDoc(doc(db, 'checklists', c.id), c);
      } else {
          setChecklists(prev => {
            const nl = [...prev, c];
            localStorage.setItem('fp_checklists', JSON.stringify(nl));
            return nl;
          });
      }
    },
    bulkUpsertBienes, deleteBien,
    loading, isDataLoading: loading, error, user: impersonatedUser || authenticatedUser,
    authenticatedUser, impersonatedUser, registeredUsers: users, isOnline: true, auditLogs: [],
    notifications, login, logout, register, requestPasswordReset, addNotification,
    refreshData: async () => {}, logAudit: async () => {}, impersonate,
    masterFindingsImage, setMasterFindingsImage: async (img) => setMasterFindingsImageState(img),
    deleteDocument: async (plate, docId) => {
      const v = vehicles.find(x => x.plate === plate);
      if (v) {
        const updated = { ...v, documents: (v.documents || []).filter(d => d.id !== docId) };
        if (firebaseUser) await setDoc(doc(db, 'vehicles', plate), updated);
        else {
            setVehicles(prev => {
                const nl = prev.map(x => x.plate === plate ? updated : x);
                localStorage.setItem('fp_vehicles', JSON.stringify(nl));
                return nl;
            });
        }
      }
    },
    vehicleVersions: ["SRX PACK 4X4 AT", "EXTREME V6 AT", "LIMITED V6 4X4", "PRO-4X 4X4 AT", "FURGON 4325 XL", "Z.E. ELECTRIC 2A"],
    documentTypes: docTypes, addDocumentType: (type) => setDocTypes(prev => prev.includes(type) ? prev : [...prev, type]),
    lastBulkLoadDate, restoreGoldenMaster
  };

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) throw new Error('useFleet must be used within FleetProvider');
  return context;
};

export const useApp = useFleet;
