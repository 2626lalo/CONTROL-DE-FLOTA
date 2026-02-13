/**
 * DEPRECATED: La restauración se gestiona vía Firebase Admin.
 */
export const backupService = {
  performHardReset: () => {
    console.warn("Hard Reset deshabilitado en modo Cloud.");
    return false;
  }
};