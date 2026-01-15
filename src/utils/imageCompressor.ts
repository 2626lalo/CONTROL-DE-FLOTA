
/**
 * Utility for compressing images before sending to Gemini API
 */

/**
 * Compress an image file to reduce size
 * @param file - The image file to compress
 * @param maxWidth - Maximum width (default 1200px)
 * @param quality - JPEG quality (0.1 to 1.0, default 0.7)
 * @returns Promise with base64 string
 */
export const compressImage = (
  file: File, 
  maxWidth: number = 1200, 
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 JPEG with specified quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = compressedBase64.split(',')[1];
        
        console.log(`📊 Imagen comprimida: ${file.name}`);
        console.log(`📏 Original: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`📏 Comprimido: ${(base64Data.length * 0.75 / 1024).toFixed(2)} KB`);
        console.log(`📐 Dimensiones: ${width}x${height}`);
        
        resolve(base64Data);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Compress multiple images
 */
export const compressImages = async (
  files: File[], 
  maxWidth: number = 1200, 
  quality: number = 0.7
): Promise<string[]> => {
  const compressedImages: string[] = [];
  
  for (const file of files) {
    try {
      const compressed = await compressImage(file, maxWidth, quality);
      compressedImages.push(compressed);
    } catch (error) {
      console.error(`Error comprimiendo ${file.name}:`, error);
      // Try to read without compression as fallback
      const base64 = await fileToBase64(file);
      compressedImages.push(base64);
    }
  }
  
  return compressedImages;
};

/**
 * Convert file to base64 without compression (fallback)
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
 * Validate if image size is acceptable
 */
export const validateImageSize = (base64String: string, maxSizeKB: number = 500): boolean => {
  // Approximate size in KB (base64 is ~33% larger than binary)
  const sizeKB = (base64String.length * 0.75) / 1024;
  
  if (sizeKB > maxSizeKB) {
    console.warn(`⚠️ Imagen muy grande: ${sizeKB.toFixed(2)} KB (máximo: ${maxSizeKB} KB)`);
    return false;
  }
  
  return true;
};
