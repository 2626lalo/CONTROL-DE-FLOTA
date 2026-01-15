/**
 * Utility for compressing and optimizing images before processing
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.7,
  maxSizeKB: 300
};

/**
 * Convert File to Base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = (e.target?.result as string).split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Compress an image file to reduce memory usage
 */
export const compressImageFile = (
  file: File,
  options: CompressionOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const { maxWidth, maxHeight, quality, maxSizeKB } = { 
      ...DEFAULT_OPTIONS, 
      ...options 
    };

    console.log(`🖼️ Comprimiendo: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    // If file is already small, return as is
    if (file.size < maxSizeKB * 1024) {
      console.log(`📦 Archivo ya pequeño, sin compresión`);
      fileToBase64(file).then(resolve).catch(reject);
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth! || height > maxHeight!) {
          const ratio = Math.min(maxWidth! / width, maxHeight! / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener contexto del canvas'));
          return;
        }
        
        // Draw image with new dimensions
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to compressed JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        const base64Data = compressedBase64.split(',')[1];
        
        // Calculate size
        const sizeKB = (base64Data.length * 0.75) / 1024;
        
        console.log(`✅ Comprimido: ${sizeKB.toFixed(2)} KB (${((sizeKB * 1024) / file.size * 100).toFixed(1)}% del original)`);
        console.log(`📐 Dimensiones: ${width}x${height}px`);
        
        if (sizeKB > maxSizeKB!) {
          console.warn(`⚠️ Imagen aún grande: ${sizeKB.toFixed(2)} KB, intentando mayor compresión...`);
          // Try again with higher compression
          compressImageFile(file, { ...options, quality: quality! * 0.7 })
            .then(resolve)
            .catch(reject);
          return;
        }
        
        resolve(base64Data);
      };
      
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Compress multiple images
 */
export const compressImageFiles = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<string[]> => {
  console.log(`📦 Comprimiendo ${files.length} imágenes...`);
  
  const compressedImages: string[] = [];
  
  // Process images sequentially to avoid memory issues
  for (let i = 0; i < files.length; i++) {
    try {
      console.log(`⏳ Procesando imagen ${i + 1}/${files.length}...`);
      const compressed = await compressImageFile(files[i], options);
      compressedImages.push(compressed);
      
      // Small delay to prevent UI blocking
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`❌ Error comprimiendo imagen ${i + 1}:`, error);
      // Fallback: use original file without compression
      try {
        const fallback = await fileToBase64(files[i]);
        compressedImages.push(fallback);
        console.log(`🔄 Usando versión sin comprimir para imagen ${i + 1}`);
      } catch (fallbackError) {
        console.error(`❌ Fallback también falló para imagen ${i + 1}`);
        throw error;
      }
    }
  }
  
  console.log(`✅ ${compressedImages.length} imágenes comprimidas exitosamente`);
  return compressedImages;
};

/**
 * Validate image size and type
 */
export const validateImage = (file: File): { valid: boolean; message?: string } => {
  const MAX_SIZE_MB = 10;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `Tipo de archivo no soportado: ${file.type}. Use JPG, PNG o WebP.`
    };
  }
  
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return {
      valid: false,
      message: `Imagen demasiado grande: ${(file.size / (1024 * 1024)).toFixed(2)} MB. Máximo: ${MAX_SIZE_MB} MB.`
    };
  }
  
  return { valid: true };
};

/**
 * Create a blob URL from base64 (for preview)
 */
export const base64ToBlobUrl = (base64: string, mimeType: string = 'image/jpeg'): string => {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  const blob = new Blob(byteArrays, { type: mimeType });
  return URL.createObjectURL(blob);
};

/**
 * Clean up blob URLs to free memory
 */
export const revokeBlobUrls = (urls: string[]): void => {
  urls.forEach(url => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Error al liberar URL:', error);
    }
  });
};
