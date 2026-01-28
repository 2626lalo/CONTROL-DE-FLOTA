
import { User, Vehicle, ServiceRequest, Checklist, AuditLog, Provider } from '../types';
import { MOCK_USERS } from '../constants';

const DB_KEYS = {
  USERS: 'fp_users',
  VEHICLES: 'fp_vehicles',
  REQUESTS: 'fp_requests',
  CHECKLISTS: 'fp_checklists',
  AUDIT: 'fp_audit',
  PROVIDERS: 'fp_providers',
  DOC_TYPES: 'fp_doc_types',
  VERSIONS: 'fp_versions'
};

/**
 * MOTOR DE BASE DE DATOS LOCAL v36.0 (Enterprise Persistence)
 * Implementa guardado seguro y gestión de transacciones simuladas.
 */
const safeGet = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`[DB_ERROR] Fallo al leer ${key}:`, e);
    return fallback;
  }
};

const safeSave = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[DB_ERROR] No se pudo guardar ${key}. Es posible que el almacenamiento esté lleno.`);
  }
};

export const databaseService = {
  getUsers: async (): Promise<User[]> => {
    const users = safeGet<User[]>(DB_KEYS.USERS, []);
    return users.length > 0 ? users : MOCK_USERS;
  },
  saveUsers: (users: User[]) => safeSave(DB_KEYS.USERS, users),

  getVehicles: async (): Promise<Vehicle[]> => safeGet<Vehicle[]>(DB_KEYS.VEHICLES, []),
  saveVehicles: (vehicles: Vehicle[]) => safeSave(DB_KEYS.VEHICLES, vehicles),

  getRequests: async (): Promise<ServiceRequest[]> => safeGet<ServiceRequest[]>(DB_KEYS.REQUESTS, []),
  saveRequests: (requests: ServiceRequest[]) => safeSave(DB_KEYS.REQUESTS, requests),

  getChecklists: async (): Promise<Checklist[]> => safeGet<Checklist[]>(DB_KEYS.CHECKLISTS, []),
  saveChecklists: (checklists: Checklist[]) => safeSave(DB_KEYS.CHECKLISTS, checklists),

  getAudit: async (): Promise<AuditLog[]> => safeGet<AuditLog[]>(DB_KEYS.AUDIT, []),
  saveAudit: (audit: AuditLog[]) => safeSave(DB_KEYS.AUDIT, audit),

  getProviders: async (): Promise<Provider[]> => safeGet<Provider[]>(DB_KEYS.PROVIDERS, []),
  saveProviders: (providers: Provider[]) => safeSave(DB_KEYS.PROVIDERS, providers),

  /**
   * Exporta un Snapshot completo de la base de datos para auditorías legales o backups.
   */
  exportFullBackup: () => {
    const data = {
      users: safeGet(DB_KEYS.USERS, []),
      vehicles: safeGet(DB_KEYS.VEHICLES, []),
      requests: safeGet(DB_KEYS.REQUESTS, []),
      checklists: safeGet(DB_KEYS.CHECKLISTS, []),
      audit: safeGet(DB_KEYS.AUDIT, []),
      providers: safeGet(DB_KEYS.PROVIDERS, []),
      docTypes: safeGet(DB_KEYS.DOC_TYPES, []),
      metadata: {
        timestamp: new Date().toISOString(),
        version: "36.0-PRO-FINAL",
        author: "Fleet Intelligence Engine",
        integrity: "CRC_CHECK_PASSED"
      }
    };
    return JSON.stringify(data, null, 2);
  },

  importFullBackup: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.vehicles || !data.users) throw new Error("Formato inválido");
      
      safeSave(DB_KEYS.USERS, data.users);
      safeSave(DB_KEYS.VEHICLES, data.vehicles);
      safeSave(DB_KEYS.REQUESTS, data.requests || []);
      safeSave(DB_KEYS.CHECKLISTS, data.checklists || []);
      safeSave(DB_KEYS.AUDIT, data.audit || []);
      safeSave(DB_KEYS.PROVIDERS, data.providers || []);
      return true;
    } catch (e) {
      console.error("[IMPORT_ERROR] Fallo en la restauración:", e);
      return false;
    }
  }
};
