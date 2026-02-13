/**
 * SERVICIO DE IMÁGENES: Ahora las imágenes se gestionan como base64 directamente en Firestore
 * o mediante URLs externas.
 */

export const galleryService = {
  storeImage: (base64: string): string => {
    return base64; // No almacenamos localmente, retornamos el stream
  },
  resolveImage: (ref: string): string => {
    return ref;
  },
  getRawGallery: () => ({}),
  importGallery: (data: any) => {}
};