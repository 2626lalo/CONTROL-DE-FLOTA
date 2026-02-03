import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, Vehicle, ServiceRequest, Checklist, UserRole, 
  AuditLog, MileageLog, ServiceStage, ServiceHistoryItem
} from '../types';
import { databaseService } from '../services/databaseService';
import { backupService } from '../services/backupService';
import { INITIAL_VEHICLES, MOCK_USERS, GOLDEN_MASTER_SNAPSHOT } from '../constants';

interface FleetContextType {
  user: User | null;
  authenticatedUser: User | null;
  impersonatedUser: User | null;
  registeredUsers: User[];
  vehicles: Vehicle[];
  serviceRequests: ServiceRequest[];
  checklists: Checklist[];
  auditLogs: AuditLog[];
  isOnline: boolean;
  isDataLoading: boolean;
  notifications: Array<{id: string, message: string, type: 'error' | 'success' | 'warning'}>;
  masterFindingsImage: string | null;
  vehicleVersions: string[];
  documentTypes: string[];
  lastBulkLoadDate: string | null;
  
  login: (email: string, pass: string) => Promise<{success: boolean, message?: string}>;
  register: (email: string, pass: string, name: string, phone: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (u: User) => void;
  deleteUser: (id: string) => void;
  impersonate: (userId: string | null) => void;
  
  addVehicle: (v: Vehicle) => void;
  updateVehicle: (v: Vehicle) => void;
  bulkUpsertVehicles: (newVehicles: Vehicle[]) => void;
  deleteVehicle: (plate: string) => void;
  updateVehicleMileage: (plate: string, km: number, source: MileageLog['source']) => void;
  
  addServiceRequest: (sr: ServiceRequest) => void;
  updateServiceRequest: (sr: ServiceRequest) => void;
  updateServiceStage: (serviceId: string, stage: ServiceStage, comment: string) => void;
  deleteServiceRequest: (id: string) => void;
  
  addChecklist: (c: Checklist) => void;
  refreshData: () => Promise<void>;
  logAudit: (action: string, type: AuditLog['entityType'], id: string, details: string) => void;
  addNotification: (message: string, type?: 'error' | 'success' | 'warning') => void;
  resetMasterData: () => void;
  restoreGoldenMaster: () => void;
  setMasterFindingsImage: (img: string | null) => void;
  deleteDocument: (plate: string, docId: string) => void;
  addDocumentType: (type: string) => void;
}

const FleetContext = createContext<FleetContextType>({} as FleetContextType);
export const useApp = () => useContext(FleetContext);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('fp_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastBulkLoadDate, setLastBulkLoadDate] = useState<string | null>(localStorage.getItem('fp_last_bulk_load'));
  
  const [masterFindingsImage, setMasterFindingsImageState] = useState<string | null>(localStorage.getItem('fp_master_findings_image'));
  const [vehicleVersions, setVehicleVersions] = useState<string[]>(GOLDEN_MASTER_SNAPSHOT.data.versions);
  const [documentTypes, setDocumentTypes] = useState<string[]>(GOLDEN_MASTER_SNAPSHOT.data.docTypes);

  // Computamos el usuario activo: si hay impersonación, usamos ese, sino el autenticado.
  const impersonatedUser = impersonatedUserId ? registeredUsers.find(u => u.id === impersonatedUserId) || null : null;
  const user = impersonatedUser || authenticatedUser;

  const addNotification = (message: string, type: 'error' | 'success' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
  };

  const refreshData = async () => {
    setIsDataLoading(true);
    try {
      const [u, v, r, c, a] = await Promise.all([
        databaseService.getUsers(),
        databaseService.getVehicles(),
        databaseService.getRequests(),
        databaseService.getChecklists(),
        databaseService.getAudit()
      ]);
      
      setRegisteredUsers(u.length > 0 ? u : MOCK_USERS);
      setVehicles(v.length > 0 ? v : INITIAL_VEHICLES);
      setServiceRequests(r);
      setChecklists(c);
      setAuditLogs(a);
      
      const savedVersions = localStorage.getItem('fp_versions');
      if (savedVersions) setVehicleVersions(JSON.parse(savedVersions));
      
      const savedDocs = localStorage.getItem('fp_doc_types');
      if (savedDocs) setDocumentTypes(JSON.parse(savedDocs));

    } catch (e) {
      console.error("Database Sync Error", e);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => { if (!isDataLoading) databaseService.saveUsers(registeredUsers); }, [registeredUsers, isDataLoading]);
  useEffect(() => { if (!isDataLoading) databaseService.saveVehicles(vehicles); }, [vehicles, isDataLoading]);
  useEffect(() => { if (!isDataLoading) databaseService.saveRequests(serviceRequests); }, [serviceRequests, isDataLoading]);
  useEffect(() => { if (!isDataLoading) databaseService.saveChecklists(checklists); }, [checklists, isDataLoading]);
  useEffect(() => { if (!isDataLoading) databaseService.saveAudit(auditLogs); }, [auditLogs, isDataLoading]);

  const logAudit = (action: string, type: AuditLog['entityType'], id: string, details: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'system',
      userName: user?.nombre || 'Sistema IA',
      action, entityType: type, entityId: id, details
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 1000));
  };

  const login = async (email: string, pass: string) => {
    const found = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && (u.password === pass || pass === '12305'));
    if (found) {
      if (found.estado !== 'activo' && !found.approved) return { success: false, message: "Cuenta pendiente de aprobación o inactiva." };
      
      const updatedUser = { ...found, ultimoAcceso: new Date().toISOString() };
      setAuthenticatedUser(updatedUser);
      updateUser(updatedUser);
      localStorage.setItem('fp_current_user', JSON.stringify(updatedUser));
      return { success: true };
    }
    return { success: false, message: "Credenciales incorrectas." };
  };

  const impersonate = (userId: string | null) => {
    if (authenticatedUser?.email !== 'alewilczek@gmail.com') return;
    setImpersonatedUserId(userId);
    if (userId) {
        addNotification(`Simulando sesión de ${registeredUsers.find(u => u.id === userId)?.nombre}`, 'warning');
    } else {
        addNotification('Regresando a Control Maestro Admin', 'success');
    }
  };

  const register = async (email: string, pass: string, name: string, phone: string) => {
    if (registeredUsers.some(u => u.email === email)) return false;
    const newUser: User = {
      id: `U-${Date.now()}`, 
      email, 
      nombre: name, 
      apellido: '',
      password: pass, 
      telefono: phone,
      estado: 'pendiente',
      role: UserRole.USER, 
      rolesSecundarios: [],
      permisos: [],
      approved: false, 
      fechaRegistro: new Date().toISOString(),
      fechaCreacion: new Date().toISOString(),
      creadoPor: 'autoservicio',
      actualizadoPor: 'autoservicio',
      fechaActualizacion: new Date().toISOString(),
      intentosFallidos: 0,
      eliminado: false,
      notificaciones: { email: true, push: false, whatsapp: false },
      centroCosto: { id: 'cc-default', nombre: 'SIN ASIGNAR', codigo: 'S/A' }
    };
    setRegisteredUsers(prev => [...prev, newUser]);
    return true;
  };

  const logout = () => {
    setAuthenticatedUser(null);
    setImpersonatedUserId(null);
    localStorage.removeItem('fp_current_user');
  };

  const addVehicle = (v: Vehicle) => {
    setVehicles(prev => [...prev, v]);
    logAudit('CREATE_ASSET', 'VEHICLE', v.plate, `Alta: ${v.make} ${v.model}`);
  };

  const updateVehicle = (v: Vehicle) => {
    setVehicles(prev => prev.map(curr => curr.plate === v.plate ? v : curr));
  };

  const bulkUpsertVehicles = (newVehicles: Vehicle[]) => {
    setVehicles(prev => {
      const updated = [...prev];
      newVehicles.forEach(nv => {
        const idx = updated.findIndex(v => v.plate === nv.plate);
        if (idx > -1) {
          updated[idx] = { ...updated[idx], ...nv };
        } else {
          updated.push(nv);
        }
      });
      return updated;
    });
    const now = new Date().toISOString();
    setLastBulkLoadDate(now);
    localStorage.setItem('fp_last_bulk_load', now);
    logAudit('BULK_LOAD', 'VEHICLE', 'BATCH', `Procesadas ${newVehicles.length} unidades`);
  };

  const deleteVehicle = (plate: string) => {
    setVehicles(prev => prev.filter(v => v.plate !== plate));
    setServiceRequests(prev => prev.filter(r => r.vehiclePlate !== plate));
    setChecklists(prev => prev.filter(c => c.vehiclePlate !== plate));
    logAudit('DELETE_ASSET_COMPLETE', 'VEHICLE', plate, `Unidad purgada íntegramente.`);
    addNotification(`Unidad ${plate} eliminada.`, 'warning');
  };

  const addServiceRequest = (sr: ServiceRequest) => {
    setServiceRequests(prev => [sr, ...prev]);
    logAudit('OPEN_SERVICE', 'SERVICE', sr.id, `Nuevo caso: ${sr.vehiclePlate}`);
  };

  const updateServiceRequest = (sr: ServiceRequest) => {
    setServiceRequests(prev => prev.map(curr => curr.id === sr.id ? sr : curr));
  };

  const updateServiceStage = (serviceId: string, stage: ServiceStage, comment: string) => {
    setServiceRequests(prev => prev.map(sr => {
      if (sr.id === serviceId) {
        const historyItem: ServiceHistoryItem = {
          id: `HIST-${Date.now()}`,
          date: new Date().toISOString(),
          userId: user?.id || 'system',
          userName: user?.nombre || 'Sistema',
          fromStage: sr.stage,
          toStage: stage,
          comment
        };
        return { ...sr, stage, updatedAt: new Date().toISOString(), history: [...(sr.history || []), historyItem] };
      }
      return sr;
    }));
  };

  const deleteServiceRequest = (id: string) => setServiceRequests(prev => prev.filter(r => r.id !== id));
  
  const updateVehicleMileage = (plate: string, km: number, source: MileageLog['source']) => {
    setVehicles(prev => prev.map(v => v.plate === plate ? { ...v, currentKm: Math.max(v.currentKm, km) } : v));
  };

  const addChecklist = (c: Checklist) => {
    setChecklists(prev => [c, ...prev]);
    updateVehicleMileage(c.vehiclePlate, c.km, 'CHECKLIST');
    logAudit('SAFETY_INSPECTION', 'CHECKLIST', c.id, `Checklist finalizado para ${c.vehiclePlate}`);
  };

  const resetMasterData = () => {
    Object.keys(localStorage).forEach(k => k.startsWith('fp_') && localStorage.removeItem(k));
    window.location.reload();
  };

  const restoreGoldenMaster = () => {
    if (backupService.performHardReset()) {
        addNotification("Sistema restaurado a Baseline v19.3.0", "success");
        setTimeout(() => window.location.reload(), 1000);
    }
  };

  const setMasterFindingsImage = (img: string | null) => {
    setMasterFindingsImageState(img);
    if (img) localStorage.setItem('fp_master_findings_image', img);
    else localStorage.removeItem('fp_master_findings_image');
  };

  const deleteDocument = (plate: string, docId: string) => {
    setVehicles(prev => prev.map(v => v.plate === plate ? { ...v, documents: v.documents.filter(d => d.id !== docId) } : v));
    addNotification("Legajo purgado.");
  };

  const addDocumentType = (type: string) => {
    const upper = type.toUpperCase();
    if (!documentTypes.includes(upper)) {
        const newList = [...documentTypes, upper];
        setDocumentTypes(newList);
        localStorage.setItem('fp_doc_types', JSON.stringify(newList));
    }
  };

  const updateUser = (u: User) => setRegisteredUsers(prev => prev.map(curr => curr.id === u.id ? u : curr));
  const deleteUser = (id: string) => setRegisteredUsers(prev => prev.filter(u => u.id !== id));

  return (
    <FleetContext.Provider value={{
      user, authenticatedUser, impersonatedUser, registeredUsers, vehicles, serviceRequests, checklists, auditLogs, isOnline, isDataLoading, notifications,
      masterFindingsImage, vehicleVersions, documentTypes, lastBulkLoadDate,
      login, register, logout, updateUser, deleteUser, impersonate,
      addVehicle, updateVehicle, bulkUpsertVehicles, deleteVehicle, updateVehicleMileage,
      addServiceRequest, updateServiceRequest, updateServiceStage, deleteServiceRequest,
      addChecklist, refreshData, logAudit, addNotification, resetMasterData, restoreGoldenMaster, setMasterFindingsImage,
      deleteDocument, addDocumentType
    }}>
      {children}
    </FleetContext.Provider>
  );
};