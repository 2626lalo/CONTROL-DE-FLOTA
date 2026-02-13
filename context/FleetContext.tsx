import React, { createContext, useContext, useEffect, useState } from 'react';
import { Vehicle, User, ServiceRequest, Checklist, AuditLog, ServiceStage, VehicleStatus, UserRole } from '../types';

// Se eliminan los MOCK_VEHICLES para iniciar la app limpia
const MOCK_VEHICLES: Vehicle[] = [];

const MOCK_USERS: User[] = [
  { id: "admin@controlflota.com", email: "admin@controlflota.com", nombre: "ADMIN", apellido: "SISTEMA", name: "ADMIN SISTEMA", telefono: "000000000", role: UserRole.ADMIN, estado: "activo", approved: true, fechaRegistro: new Date().toISOString(), intentosFallidos: 0, centroCosto: { id: "1", nombre: "CENTRAL", codigo: "001" }, level: 3, rolesSecundarios: [], notificaciones: { email: true, push: false, whatsapp: false }, creadoPor: "system", fechaCreacion: new Date().toISOString(), actualizadoPor: "system", fechaActualizacion: new Date().toISOString(), eliminado: false },
  { id: "alewilczek@gmail.com", email: "alewilczek@gmail.com", nombre: "ALE", apellido: "WILCZEK", name: "ALE WILCZEK", telefono: "123456789", role: UserRole.ADMIN, estado: "activo", approved: true, fechaRegistro: new Date().toISOString(), intentosFallidos: 0, centroCosto: { id: "1", nombre: "CENTRAL", codigo: "001" }, level: 3, rolesSecundarios: [], notificaciones: { email: true, push: false, whatsapp: false }, creadoPor: "system", fechaCreacion: new Date().toISOString(), actualizadoPor: "system", fechaActualizacion: new Date().toISOString(), eliminado: false }
];

interface FleetContextType {
  vehicles: Vehicle[];
  users: User[];
  serviceRequests: ServiceRequest[];
  checklists: Checklist[];
  addVehicle: (v: Vehicle) => Promise<void>;
  updateVehicle: (v: Vehicle) => Promise<void>;
  bulkUpsertVehicles: (vs: Vehicle[]) => Promise<void>;
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
  register: (email: string, pass: string, name: string, lastName: string, phone: string) => Promise<{success: boolean, message?: string}>;
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [masterFindingsImage, setMasterFindingsImageState] = useState<string | null>(null);
  const [docTypes, setDocTypes] = useState<string[]>(['CEDULA', 'TITULO', 'VTV', 'SEGURO']);
  const [lastBulkLoadDate, setLastBulkLoadDate] = useState<string | null>(localStorage.getItem('fp_last_bulk_load'));

  useEffect(() => {
    const savedVehicles = localStorage.getItem('fp_vehicles');
    const savedUsers = localStorage.getItem('fp_users');
    const savedRequests = localStorage.getItem('fp_requests');
    const savedChecklists = localStorage.getItem('fp_checklists');
    const currentUser = localStorage.getItem('fp_currentUser');

    if (savedVehicles) {
      setVehicles(JSON.parse(savedVehicles));
    } else {
      // Solo cargar mocks si no hay nada guardado en absoluto
      setVehicles(MOCK_VEHICLES);
      localStorage.setItem('fp_vehicles', JSON.stringify(MOCK_VEHICLES));
    }

    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers(MOCK_USERS);
      localStorage.setItem('fp_users', JSON.stringify(MOCK_USERS));
    }

    if (savedRequests) setServiceRequests(JSON.parse(savedRequests));
    if (savedChecklists) setChecklists(JSON.parse(savedChecklists));
    if (currentUser) setAuthenticatedUser(JSON.parse(currentUser));

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

  const bulkUpsertVehicles = async (newVehicles: Vehicle[]) => {
    setVehicles(prev => {
      const vehicleMap = new Map<string, Vehicle>(prev.map(v => [v.plate.toUpperCase(), v] as [string, Vehicle]));
      
      newVehicles.forEach(nv => {
        const plate = nv.plate.toUpperCase();
        if (vehicleMap.has(plate)) {
          const existing = vehicleMap.get(plate)!;
          vehicleMap.set(plate, { 
            ...existing, 
            ...nv,
            documents: existing.documents || nv.documents,
            mileageHistory: existing.mileageHistory || nv.mileageHistory,
            images: { ...existing.images, ...nv.images }
          });
        } else {
          vehicleMap.set(plate, nv);
        }
      });

      const newList = Array.from(vehicleMap.values());
      localStorage.setItem('fp_vehicles', JSON.stringify(newList));
      
      const now = new Date().toISOString();
      setLastBulkLoadDate(now);
      localStorage.setItem('fp_last_bulk_load', now);
      
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

  const login = async (email: string, pass: string) => {
    const emailLower = email.toLowerCase().trim();
    const found = users.find(u => u.email.toLowerCase() === emailLower);
    
    if (emailLower === 'alewilczek@gmail.com' && pass === 'Joaquin4') {
      const master = found || MOCK_USERS[1];
      setAuthenticatedUser(master);
      localStorage.setItem('fp_currentUser', JSON.stringify(master));
      return { success: true };
    }

    if (found && (pass === 'Test123!' || pass === 'Joaquin4')) {
      if (!found.approved) {
        return { success: false, message: "Su cuenta está pendiente de aprobación." };
      }
      setAuthenticatedUser(found);
      localStorage.setItem('fp_currentUser', JSON.stringify(found));
      return { success: true };
    }
    return { success: false, message: "Credenciales incorrectas." };
  };

  const logout = async () => {
    setAuthenticatedUser(null);
    localStorage.removeItem('fp_currentUser');
  };

  const register = async (email: string, pass: string, name: string, lastName: string, phone: string) => {
    const emailLower = email.toLowerCase().trim();
    
    if (users.some(u => u.email.toLowerCase() === emailLower)) {
      return { success: false, message: "El email ya se encuentra registrado." };
    }

    const newUser: User = {
        id: emailLower,
        email: emailLower,
        nombre: name.toUpperCase(),
        apellido: lastName.toUpperCase(),
        name: `${name} ${lastName}`.toUpperCase(),
        telefono: phone,
        role: UserRole.USER,
        estado: 'pendiente',
        approved: false,
        fechaRegistro: new Date().toISOString(),
        intentosFallidos: 0,
        centroCosto: { id: "0", nombre: "PENDIENTE", codigo: "000" },
        level: 1,
        rolesSecundarios: [],
        notificaciones: { email: true, push: false, whatsapp: false },
        creadoPor: "self",
        fechaCreacion: new Date().toISOString(),
        actualizadoPor: "self",
        fechaActualizacion: new Date().toISOString(),
        eliminado: false
    };

    setUsers(prev => {
        const newList = [...prev, newUser];
        localStorage.setItem('fp_users', JSON.stringify(newList));
        return newList;
    });
    return { success: true };
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

  const restoreGoldenMaster = async () => {
      localStorage.clear();
      window.location.reload();
  };

  const value: FleetContextType = {
    vehicles, users, serviceRequests, checklists,
    addVehicle, updateVehicle, bulkUpsertVehicles, deleteVehicle,
    addUser: async () => {}, updateUser: async (u) => {
      setUsers(prev => {
        const nl = prev.map(x => x.id === u.id ? u : x);
        localStorage.setItem('fp_users', JSON.stringify(nl));
        return nl;
      });
    }, deleteUser: async (id) => {
       setUsers(prev => {
        const nl = prev.filter(x => x.id !== id);
        localStorage.setItem('fp_users', JSON.stringify(nl));
        return nl;
      });
    },
    addServiceRequest: async (r) => {
      setServiceRequests(prev => {
        const nl = [...prev, r];
        localStorage.setItem('fp_requests', JSON.stringify(nl));
        return nl;
      });
    }, 
    updateServiceRequest: async (r) => {
      setServiceRequests(prev => {
        const nl = prev.map(x => x.id === r.id ? r : x);
        localStorage.setItem('fp_requests', JSON.stringify(nl));
        return nl;
      });
    }, 
    updateServiceStage: async (id, stage, comment) => {
      setServiceRequests(prev => {
        const nl = prev.map(x => x.id === id ? {
          ...x, 
          stage, 
          history: [...(x.history || []), { id: Date.now().toString(), date: new Date().toISOString(), userId: authenticatedUser?.id || 'sys', userName: authenticatedUser?.nombre || 'Sist', toStage: stage, comment }]
        } : x);
        localStorage.setItem('fp_requests', JSON.stringify(nl));
        return nl;
      });
    },
    addChecklist: async (c) => {
      setChecklists(prev => {
        const nl = [...prev, c];
        localStorage.setItem('fp_checklists', JSON.stringify(nl));
        return nl;
      });
    },
    loading,
    isDataLoading: loading,
    error,
    user: impersonatedUser || authenticatedUser,
    authenticatedUser,
    impersonatedUser,
    registeredUsers: users,
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
    deleteDocument: async (plate, docId) => {
      setVehicles(prev => {
        const nl = prev.map(v => {
          if (v.plate === plate) {
            return { ...v, documents: (v.documents || []).filter(d => d.id !== docId) };
          }
          return v;
        });
        localStorage.setItem('fp_vehicles', JSON.stringify(nl));
        return nl;
      });
    },
    vehicleVersions: ["SRX PACK 4X4 AT", "EXTREME V6 AT", "LIMITED V6 4X4", "PRO-4X 4X4 AT", "FURGON 4325 XL", "Z.E. ELECTRIC 2A"],
    documentTypes: docTypes,
    addDocumentType: (type) => setDocTypes(prev => prev.includes(type) ? prev : [...prev, type]),
    lastBulkLoadDate,
    restoreGoldenMaster
  };

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) throw new Error('useFleet must be used within FleetProvider');
  return context;
};

export const useApp = useFleet;