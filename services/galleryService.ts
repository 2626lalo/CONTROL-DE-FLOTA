/**
 * MOTOR DE ALMACENAMIENTO DE IMÁGENES v1.0 (Virtual Firebase Storage)
 * Este servicio separa los binarios de la base de datos principal para optimizar rendimiento.
 */

const GALLERY_KEY = 'fp_gallery';

interface Gallery {
  [id: string]: string; // id -> base64
}

const getGallery = (): Gallery => {
  try {
    const data = localStorage.getItem(GALLERY_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Fallo al leer galería:", e);
    return {};
  }
};

const saveGallery = (gallery: Gallery) => {
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
  } catch (e) {
    console.warn("Galería llena. Optimizando espacio...", e);
  }
};

export const galleryService = {
  /**
   * Guarda una imagen y devuelve su 'dirección' virtual.
   */
  storeImage: (base64: string): string => {
    if (!base64 || !base64.startsWith('data:image')) return base64;
    
    // Generar un ID único basado en el contenido (deduplicación básica)
    const id = `img_${Math.random().toString(36).substring(2, 11)}`;
    const gallery = getGallery();
    gallery[id] = base64;
    saveGallery(gallery);
    
    return `gallery://${id}`;
  },

  /**
   * Resuelve una dirección virtual a su base64 original.
   */
  resolveImage: (ref: string): string => {
    if (!ref || !ref.startsWith('gallery://')) return ref;
    
    const id = ref.replace('gallery://', '');
    const gallery = getGallery();
    return gallery[id] || ref;
  },

  /**
   * Exporta toda la galería para backups.
   */
  getRawGallery: () => getGallery(),
  
  /**
   * Importa una galería externa.
   */
  importGallery: (data: Gallery) => saveGallery({ ...getGallery(), ...data })
};