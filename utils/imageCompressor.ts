
/**
 * Comprime una imagen en base64 para optimizar almacenamiento y velocidad.
 * Redimensiona proporcionalmente si excede el ancho/alto máximo.
 */
export const compressImage = async (base64Str: string, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onerror = (err) => reject(err);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calcular proporciones
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(base64Str); // Fallback al original si falla el contexto
                return;
            }

            // Fondo blanco para evitar transparencias negras en JPEG
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Exportar como JPEG para máxima compresión de fotos
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
    });
};
