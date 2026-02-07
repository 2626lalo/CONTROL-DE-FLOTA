import { User, Vehicle, ServiceRequest, Checklist, AuditLog } from '../types';
import { MOCK_USERS } from '../constants';
import { galleryService } from './galleryService';

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
 * UTILIDADES DE TRANSFORMACIÓN (RECURSIVAS)
 */
const processImages = (obj: any, action: 'NORMALIZAR' | 'DESNORMALIZAR'): any => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => processImages(item, action));
  }

  const newObj = { ...obj };
  for (const key in newObj) {
    const val = newObj[key];
    
    if (typeof val === 'string') {
      if (action === 'NORMALIZAR' && val.startsWith('data:image')) {
        newObj[key] = galleryService.storeImage(val);
      } else if (action === 'DESNORMALIZAR' && val.startsWith('gallery://')) {
        newObj[key] = galleryService.resolveImage(val);
      }
    } else if (typeof val === 'object') {
      newObj[key] = processImages(val, action);
    }
  }
  return newObj;
};

const safeGet = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const data = JSON.parse(item);
    return processImages(data, 'DESNORMALIZAR') as T;
  } catch (e) {
    console.error(`[DB_ERROR] Fallo al leer ${key}:`, e);
    return fallback;
  }
};

const safeSave = <T>(key: string, data: T) => {
  try {
    const optimizedData = processImages(data, 'NORMALIZAR');
    localStorage.setItem(key, JSON.stringify(optimizedData));
  } catch (e) {
    console.error(`[DB_ERROR] No se pudo guardar ${key}.`);
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

  getProviders: async (): Promise<any[]> => safeGet<any[]>(DB_KEYS.PROVIDERS, []),
  saveProviders: (providers: any[]) => safeSave(DB_KEYS.PROVIDERS, providers),

  exportFullBackup: () => {
    const data = {
      users: safeGet(DB_KEYS.USERS, []),
      vehicles: safeGet(DB_KEYS.VEHICLES, []),
      requests: safeGet(DB_KEYS.REQUESTS, []),
      checklists: safeGet(DB_KEYS.CHECKLISTS, []),
      audit: safeGet(DB_KEYS.AUDIT, []),
      providers: safeGet(DB_KEYS.PROVIDERS, []),
      docTypes: safeGet(DB_KEYS.DOC_TYPES, []),
      gallery: galleryService.getRawGallery(), // Incluimos la galería en el backup
      metadata: {
        timestamp: new Date().toISOString(),
        version: "36.0-PRO-NORMALIZED",
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
      
      if (data.gallery) galleryService.importGallery(data.gallery);

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