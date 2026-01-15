// Gemini AI Service para procesamiento de imágenes vehiculares
// Usa la clave API: AIzaSyCNtMrkX8I2x-5taJn_j9JF3Ax_p9kPYFc

// Variable global para la instancia de Gemini AI
let genAIInstance: any = null;
let isInitializing = false;

/**
 * Inicializa o retorna la instancia de Gemini AI
 */
const getGenAI = async (): Promise<any> => {
  // Si ya está inicializado, retornar la instancia
  if (genAIInstance) {
    return genAIInstance;
  }

  // Si se está inicializando, esperar
  if (isInitializing) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getGenAI();
  }

  isInitializing = true;
  
  try {
    console.log('🔧 Inicializando Gemini AI...');
    
    // Obtener la clave API - primero de variable de entorno, luego clave directa
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || 'AIzaSyCNtMrkX8I2x-5taJn_j9JF3Ax_p9kPYFc';
    
    console.log('🔑 API Key disponible:', apiKey ? 'Sí' : 'No');
    if (apiKey) {
      console.log('🔑 API Key (primeros 10 chars):', apiKey.substring(0, 10) + '...');
    }

    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error('API key no configurada. Configura VITE_GOOGLE_AI_API_KEY en las variables de entorno.');
    }

    // Importar dinámicamente el SDK
    const { GoogleGenerativeAI } = await import('@google/genai');
    
    // Crear instancia
    genAIInstance = new GoogleGenerativeAI(apiKey);
    
    console.log('✅ Gemini AI inicializado correctamente');
    isInitializing = false;
    return genAIInstance;
    
  } catch (error) {
    console.error('❌ Error inicializando Gemini AI:', error);
    isInitializing = false;
    throw error;
  }
};

/**
 * Verifica la conexión con Gemini AI
 */
export const testGeminiConnection = async () => {
  try {
    console.log('🔍 Probando conexión con Gemini AI...');
    
    const genAI = await getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        maxOutputTokens: 50,
      }
    });
    
    // Prueba simple con timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout después de 10 segundos')), 10000)
    );
    
    const result = await Promise.race([
      model.generateContent('Responde con "OK" si estás funcionando correctamente.'),
      timeoutPromise
    ]);
    
    const response = await (result as any).response;
    const text = response.text();
    
    console.log('✅ Conexión exitosa:', text.trim());
    return { 
      success: true, 
      message: text.trim(),
      status: 'connected'
    };
    
  } catch (error: any) {
    console.error('❌ Error de conexión:', error.message || error);
    return { 
      success: false, 
      error: error.message || 'Error desconocido',
      status: 'disconnected'
    };
  }
};

/**
 * Analiza imágenes del vehículo para extraer datos
 */
export const analyzeVehicleImage = async (imagesBase64: string[]) => {
  try {
    console.log('🚀 Iniciando análisis de imagen de vehículo...');
    console.log('📷 Número de imágenes:', imagesBase64.length);
    
    const genAI = await getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro-vision',
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    const prompt = `Eres un experto en reconocimiento de vehículos. Analiza la imagen y extrae la siguiente información en formato JSON válido:

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional, sin marcas de código, sin explicaciones.

{
  "plate": "número de placa si es visible",
  "make": "marca del vehículo",
  "model": "modelo del vehículo",
  "year": año numérico,
  "color": "color principal",
  "type": "tipo (Sedan, SUV, Pickup, Van, Truck, Other)",
  "vin": "número VIN si es visible",
  "motorNum": "número de motor si es visible"
}

Reglas:
1. Si un campo no es visible, usar null
2. El año debe ser un número (ej: 2023)
3. Los textos en español
4. Solo responder con el JSON, sin texto adicional`;

    // Preparar las imágenes
    const imageParts = imagesBase64.map(base64 => {
      // Limpiar el base64 si tiene prefijo data URL
      const cleanBase64 = base64.includes('base64,') 
        ? base64.split(',')[1] 
        : base64;
      
      return {
        inlineData: {
          data: cleanBase64,
          mimeType: 'image/jpeg',
        },
      };
    });

    console.log('📤 Enviando solicitud a Gemini...');
    
    // Timeout de 30 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const result = await model.generateContent([prompt, ...imageParts]);
      clearTimeout(timeoutId);
      
      const response = await result.response;
      const text = response.text();
      
      console.log('📥 Respuesta recibida:', text.substring(0, 150) + '...');

      // Extraer JSON de la respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ No se pudo extraer JSON, respuesta completa:', text);
        throw new Error('No se pudo extraer JSON de la respuesta');
      }

      let parsedData;
      try {
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        // Intentar limpiar el JSON
        const cleanedText = jsonMatch[0]
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
        parsedData = JSON.parse(cleanedText);
      }
      
      console.log('✅ Datos parseados exitosamente:', parsedData);
      
      return {
        success: true,
        data: {
          plate: parsedData.plate || null,
          make: parsedData.make || null,
          model: parsedData.model || null,
          year: parsedData.year || null,
          color: parsedData.color || null,
          type: parsedData.type || 'Other',
          vin: parsedData.vin || null,
          motorNum: parsedData.motorNum || null,
        }
      };
      
    } catch (timeoutError) {
      console.error('⏰ Timeout en análisis de imagen');
      throw new Error('El análisis tomó demasiado tiempo. Intenta con una imagen más clara.');
    }

  } catch (error: any) {
    console.error('❌ Error en analyzeVehicleImage:', error.message || error);
    
    return {
      success: false,
      error: error.message || 'Error procesando la imagen',
      data: {
        plate: null,
        make: null,
        model: null,
        year: null,
        color: null,
        type: 'Other',
        vin: null,
        motorNum: null,
      }
    };
  }
};

/**
 * Analiza documentos (cédula, seguro) para extraer datos
 */
export const analyzeDocumentImage = async (imageBase64: string, docType: string, mimeType: string) => {
  try {
    console.log(`🚀 Iniciando análisis de documento: ${docType}...`);
    
    const genAI = await getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro-vision',
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    let prompt = '';
    
    if (docType === 'Cédula') {
      prompt = `Eres un experto en documentos vehiculares. Analiza la imagen de la cédula vehicular y extrae la siguiente información en formato JSON válido:

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional, sin marcas de código, sin explicaciones.

{
  "plate": "número de placa",
  "vin": "número de chasis/VIN",
  "motorNum": "número de motor",
  "year": año de fabricación,
  "make": "marca",
  "model": "modelo",
  "color": "color",
  "type": "tipo de vehículo"
}

Reglas:
1. Solo responder con el JSON
2. Usar null para campos no encontrados
3. Textos en español`;
    } else if (docType === 'Insurance') {
      prompt = `Eres un experto en pólizas de seguro. Analiza el documento y extrae la siguiente información en formato JSON válido:

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional, sin marcas de código, sin explicaciones.

{
  "issuer": "compañía aseguradora",
  "policyNumber": "número de póliza",
  "expirationDate": "fecha de vencimiento (YYYY-MM-DD)",
  "year": "año del vehículo",
  "isValid": true/false
}

Reglas:
1. Solo responder con el JSON
2. Fecha en formato YYYY-MM-DD
3. Textos en español`;
    } else {
      prompt = `Eres un experto en documentos. Analiza la imagen y extrae cualquier información relevante en formato JSON válido.

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.`;
    }

    // Limpiar el base64 si tiene prefijo data URL
    const cleanBase64 = imageBase64.includes('base64,') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType || 'image/jpeg',
      },
    };

    console.log('📤 Enviando solicitud a Gemini...');
    
    // Timeout de 30 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const result = await model.generateContent([prompt, imagePart]);
      clearTimeout(timeoutId);
      
      const response = await result.response;
      const text = response.text();
      
      console.log('📥 Respuesta recibida:', text.substring(0, 150) + '...');

      // Extraer JSON de la respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ No se pudo extraer JSON, respuesta completa:', text);
        throw new Error('No se pudo extraer JSON de la respuesta');
      }

      let parsedData;
      try {
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        // Intentar limpiar el JSON
        const cleanedText = jsonMatch[0]
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
        parsedData = JSON.parse(cleanedText);
      }
      
      console.log('✅ Datos parseados exitosamente:', parsedData);
      
      return {
        success: true,
        data: {
          plate: parsedData.plate || null,
          vin: parsedData.vin || null,
          motorNum: parsedData.motorNum || null,
          year: parsedData.year || null,
          make: parsedData.make || null,
          model: parsedData.model || null,
          color: parsedData.color || null,
          type: parsedData.type || null,
          issuer: parsedData.issuer || null,
          policyNumber: parsedData.policyNumber || null,
          expirationDate: parsedData.expirationDate || null,
          isValid: parsedData.isValid || false,
        }
      };
      
    } catch (timeoutError) {
      console.error('⏰ Timeout en análisis de documento');
      throw new Error('El análisis tomó demasiado tiempo. Intenta con una imagen más clara.');
    }

  } catch (error: any) {
    console.error(`❌ Error en analyzeDocumentImage (${docType}):`, error.message || error);
    
    return {
      success: false,
      error: error.message || 'Error procesando el documento',
      data: {
        plate: null,
        vin: null,
        motorNum: null,
        year: null,
        make: null,
        model: null,
        color: null,
        type: null,
        issuer: null,
        policyNumber: null,
        expirationDate: null,
        isValid: false,
      }
    };
  }
};

/**
 * Analiza imágenes de baterías de vehículos
 */
export const analyzeBatteryImage = async (imageBase64: string): Promise<{brand: string | null, serialNumber: string | null, capacity: string | null, voltage: string | null, manufactureDate: string | null}> => {
  try {
    console.log('🚀 Iniciando análisis de imagen de batería...');
    
    const genAI = await getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro-vision',
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    const prompt = `Eres un experto en baterías vehiculares. Analiza la imagen de la batería y extrae la siguiente información en formato JSON válido:

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional, sin marcas de código, sin explicaciones.

{
  "brand": "marca de la batería",
  "serialNumber": "número de serie o lote",
  "capacity": "capacidad en Ah",
  "voltage": "voltaje (ej: 12V)",
  "manufactureDate": "fecha de fabricación (YYYY-MM-DD) si es visible"
}

Reglas:
1. Solo responder con el JSON
2. Usar null para campos no encontrados
3. Textos en español`;

    const cleanBase64 = imageBase64.includes('base64,') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: 'image/jpeg',
      },
    };

    console.log('📤 Enviando solicitud a Gemini...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const result = await model.generateContent([prompt, imagePart]);
    clearTimeout(timeoutId);
    
    const response = await result.response;
    const text = response.text();
    
    console.log('📥 Respuesta recibida:', text.substring(0, 150) + '...');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ No se pudo extraer JSON, respuesta completa:', text);
      throw new Error('No se pudo extraer JSON de la respuesta');
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      const cleanedText = jsonMatch[0]
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      parsedData = JSON.parse(cleanedText);
    }
    
    console.log('✅ Datos parseados exitosamente:', parsedData);
    
    return {
      brand: parsedData.brand || null,
      serialNumber: parsedData.serialNumber || null,
      capacity: parsedData.capacity || null,
      voltage: parsedData.voltage || null,
      manufactureDate: parsedData.manufactureDate || null,
    };
    
  } catch (error: any) {
    console.error('❌ Error en analyzeBatteryImage:', error.message || error);
    
    return {
      brand: null,
      serialNumber: null,
      capacity: null,
      voltage: null,
      manufactureDate: null,
    };
  }
};

/**
 * Analiza etiquetas de extintores
 */
export const analyzeExtinguisherLabel = async (imageBase64: string): Promise<{expirationDate: string | null, type: string | null, capacity: string | null, lastServiceDate: string | null}> => {
  try {
    console.log('🚀 Iniciando análisis de etiqueta de extintor...');
    
    const genAI = await getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro-vision',
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    const prompt = `Eres un experto en seguridad y extintores. Analiza la imagen de la etiqueta del extintor y extrae la siguiente información en formato JSON válido:

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional, sin marcas de código, sin explicaciones.

{
  "expirationDate": "fecha de vencimiento (YYYY-MM-DD) si es visible",
  "type": "tipo de extintor (Agua, CO2, Polvo Químico, Espuma, Otro)",
  "capacity": "capacidad (ej: 5 kg, 10 lb)",
  "lastServiceDate": "última fecha de servicio (YYYY-MM-DD) si es visible"
}

Reglas:
1. Solo responder con el JSON
2. Usar null para campos no encontrados
3. Textos en español`;

    const cleanBase64 = imageBase64.includes('base64,') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: 'image/jpeg',
      },
    };

    console.log('📤 Enviando solicitud a Gemini...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const result = await model.generateContent([prompt, imagePart]);
    clearTimeout(timeoutId);
    
    const response = await result.response;
    const text = response.text();
    
    console.log('📥 Respuesta recibida:', text.substring(0, 150) + '...');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ No se pudo extraer JSON, respuesta completa:', text);
      throw new Error('No se pudo extraer JSON de la respuesta');
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      const cleanedText = jsonMatch[0]
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      parsedData = JSON.parse(cleanedText);
    }
    
    console.log('✅ Datos parseados exitosamente:', parsedData);
    
    return {
      expirationDate: parsedData.expirationDate || null,
      type: parsedData.type || null,
      capacity: parsedData.capacity || null,
      lastServiceDate: parsedData.lastServiceDate || null,
    };
    
  } catch (error: any) {
    console.error('❌ Error en analyzeExtinguisherLabel:', error.message || error);
    
    return {
      expirationDate: null,
      type: null,
      capacity: null,
      lastServiceDate: null,
    };
  }
};

/**
 * Versión simplificada para desarrollo/fallback de batería
 */
export const analyzeBatteryImageSimple = async (imageBase64: string) => {
  try {
    // Intentar con la función principal
    return await analyzeBatteryImage(imageBase64);
  } catch (error) {
    console.warn('⚠️ Usando análisis simplificado de batería');
    
    // Simulación de datos para desarrollo
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      brand: 'Bosch',
      serialNumber: 'BAT-2024-5678',
      capacity: '70Ah',
      voltage: '12V',
      manufactureDate: '2023-05-15',
    };
  }
};

/**
 * Versión simplificada para desarrollo/fallback de extintor
 */
export const analyzeExtinguisherLabelSimple = async (imageBase64: string) => {
  try {
    // Intentar con la función principal
    return await analyzeExtinguisherLabel(imageBase64);
  } catch (error) {
    console.warn('⚠️ Usando análisis simplificado de extintor');
    
    // Simulación de datos para desarrollo
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    
    return {
      expirationDate: nextYear.toISOString().split('T')[0],
      type: 'Polvo Químico',
      capacity: '5 kg',
      lastServiceDate: new Date().toISOString().split('T')[0],
    };
  }
};

/**
 * Verifica si Gemini AI está disponible
 */
export const isGeminiAvailable = async (): Promise<boolean> => {
  try {
    // Verificar que tenemos la API key
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || 'AIzaSyCNtMrkX8I2x-5taJn_j9JF3Ax_p9kPYFc';
    
    if (!apiKey || apiKey === 'your_api_key_here' || apiKey.length < 30) {
      console.log('❌ API key inválida o no configurada');
      return false;
    }
    
    // Probar conexión real
    const testResult = await testGeminiConnection();
    return testResult.success;
    
  } catch (error) {
    console.error('❌ Error verificando disponibilidad de Gemini:', error);
    return false;
  }
};

/**
 * Obtiene información del estado de Gemini AI
 */
export const getGeminiStatus = async () => {
  try {
    const testResult = await testGeminiConnection();
    
    return {
      available: testResult.success,
      status: testResult.status,
      message: testResult.message || testResult.error,
      apiKeyConfigured: !!(import.meta.env.VITE_GOOGLE_AI_API_KEY || 'AIzaSyCNtMrkX8I2x-5taJn_j9JF3Ax_p9kPYFc'),
      timestamp: new Date().toISOString(),
    };
    
  } catch (error: any) {
    return {
      available: false,
      status: 'error',
      message: error.message || 'Error desconocido',
      apiKeyConfigured: false,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Procesamiento simulado para cuando Gemini no está disponible (modo demo)
 */
export const processImageWithMock = async (imageType: 'front' | 'back' | 'document'): Promise<any> => {
  console.log(`🔄 Usando procesamiento mock para: ${imageType}`);
  
  // Datos de ejemplo para testing
  const mockData: any = {
    front: {
      success: true,
      data: {
        plate: 'ABC123',
        make: 'Toyota',
        model: 'Corolla',
        year: 2022,
        color: 'Blanco',
        type: 'Sedan',
        vin: '1HGCM82633A123456',
        motorNum: 'MTR789012'
      }
    },
    back: {
      success: true,
      data: {
        plate: 'ABC123',
        vin: '1HGCM82633A123456',
        motorNum: 'MTR789012',
        year: 2022,
        make: 'Toyota',
        model: 'Corolla',
        color: 'Blanco',
        type: 'Sedan'
      }
    },
    document: {
      success: true,
      data: {
        issuer: 'MAPFRE',
        policyNumber: 'POL-123456',
        expirationDate: '2024-12-31',
        year: 2022,
        isValid: true,
        plate: 'ABC123',
        make: 'Toyota',
        model: 'Corolla'
      }
    }
  };
  
  // Simular delay de procesamiento
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return mockData[imageType] || { success: false, data: {} };
};
