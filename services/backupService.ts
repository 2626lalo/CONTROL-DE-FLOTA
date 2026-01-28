
import { GOLDEN_MASTER_SNAPSHOT } from '../constants';

/**
 * MOTOR DE RESTAURACIÓN MAESTRO v19.3.0
 * Este servicio garantiza la recuperación total del ecosistema FleetPro.
 */
export const backupService = {
  /**
   * Hard Reset Integral a la versión estable v19.3.0-STABLE.
   * Restaura meticulosamente: Vehículos, Usuarios, Checklists, Servicios, 
   * Proveedores, Plano Maestro, Versiones y Tipos de Documentos.
   */
  performHardReset: () => {
    try {
      const { data, version } = GOLDEN_MASTER_SNAPSHOT;
      const currentUser = localStorage.getItem('fp_current_user');
      
      // 1. PURGA ATÓMICA: Eliminamos todas las llaves con prefijo del sistema
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('fp_')) {
          localStorage.removeItem(key);
        }
      });

      // 2. RECONSTRUCCIÓN ESTRUCTURAL: Seteamos cada sector desde el snapshot maestro
      localStorage.setItem('fp_vehicles', JSON.stringify(data.vehicles));
      localStorage.setItem('fp_users', JSON.stringify(data.users));
      localStorage.setItem('fp_checklists', JSON.stringify(data.checklists || []));
      localStorage.setItem('fp_requests', JSON.stringify(data.requests || []));
      localStorage.setItem('fp_providers', JSON.stringify(data.providers || []));
      localStorage.setItem('fp_versions', JSON.stringify(data.versions));
      localStorage.setItem('fp_doc_types', JSON.stringify(data.docTypes));
      
      // 3. RESTAURACIÓN DE AJUSTES GLOBALES
      if (data.masterFindingsImage) {
        localStorage.setItem('fp_master_findings_image', data.masterFindingsImage);
      } else {
        localStorage.removeItem('fp_master_findings_image');
      }

      // 4. LOG DE AUDITORÍA DE RECUPERACIÓN
      const restoreLog = [{
        id: `LOG-RESTORE-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'system',
        userName: 'KERNEL-MASTER',
        action: `FULL_SYSTEM_RECOVERY_${version.replace(/\./g, '_')}`,
        entityType: 'USER',
        entityId: 'ROOT',
        details: `HARD_RESET_EXECUTED: El sistema ha sido restaurado exitosamente al baseline ${version}. Se han recuperado todos los módulos: Servicios, Flota, Legajos y Planos Técnicos.`
      }];
      localStorage.setItem('fp_audit', JSON.stringify(restoreLog));

      // 5. PERSISTENCIA DE SESIÓN: Mantenemos al usuario actual para evitar logout forzado
      if (currentUser) {
        localStorage.setItem('fp_current_user', currentUser);
      }

      console.info(`[BACKUP_SERVICE] Restauración a versión ${version} completada.`);
      return true;
    } catch (e) {
      console.error("CRITICAL_RESTORE_ERROR:", e);
      return false;
    }
  }
};
