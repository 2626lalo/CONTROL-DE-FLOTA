// Gemini AI Service - Versión simplificada y estable
// Usa la clave API: AIzaSyCNtMrkX8I2x-5taJn_j9JF3Ax_p9kPYFc

// Variable global para la instancia de Google AI
let googleAIInstance: any = null;
let isLoading = false;

/**
 * Inicializa Google AI de manera segura
 */
const initializeGoogleAI = async () => {
  if (googleAIInstance) return googleAIInstance;
  if (isLoading) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return initializeGoogleAI();
  }

  isLoading = true;
  
  try {
    console.log('🔧 Inicializando Google AI...');
    
    // Obtener la clave API
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || 'AIzaSyCNtMrkX8I2x-5taJn_j9JF3Ax_p9kPYFc';
    
    console.log('🔑 API Key configurada:', apiKey ? 'Sí' : 'No');
    console.log('🔑 API Key (inicio):', apiKey ? apiKey.substring(0, 15) + '...' : 'No hay');
    
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error('Google AI API key no configurada');
    }

    // Intentar cargar el SDK
    console.log('📦 Cargando SDK de Google AI...');
    
    // Opción 1: Intentar con @google/generative-ai (paquete oficial)
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      console.log('✅ Usando @google/generative-ai');
      googleAIInstance = new GoogleGenerativeAI(apiKey);
    } catch (error1) {
      console.log('⚠️ @google/generative-ai falló, probando @google/genai...');
      
      // Opción 2: Intentar con @google/genai
      try {
        const { GoogleGenerativeAI } = await import('@google/genai');
        console.log('✅ Usando @google/genai');
        googleAIInstance = new GoogleGenerativeAI(apiKey);
      } catch (error2) {
        console.error('❌ Ambos paquetes fallaron:', error2);
        throw new Error('No se pudo cargar el SDK de Google AI. Verifica las dependencias.');
      }
    }

    console.log('✅ Google AI inicializado correctamente');
    isLoading = false;
    return googleAIInstance;
    
  } catch (error) {
    console.error('❌ Error inicializando Google AI:', error);
    isLoading = false;
    throw error;
  }
};

/**
 * Verifica la conexión con Google AI
 */
export const testGeminiConnection = async () => {
  try {
    console.log('🔍 Probando conexión con Google AI...');
    
    const genAI = await initializeGoogleAI();
    
    if (!genAI) {
      return {
        success: false,
        error: 'No se pudo inicializar Google AI',
        status: 'disconnected'
      };
    }

    // Usar un modelo simple para prueba
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 20,
      }
    });

    // Prueba simple con timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout después de 15 segundos')), 15000)
    );

    console.log('📤 Enviando solicitud de prueba...');
    const result = await Promise.race([
      model.generateContent('Responde con "OK"'),
      timeoutPromise
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Conexión exitosa:', text);
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
 * Test directo de la API key usando Fetch
 */
export const testApiKeyDirectly = async () => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || 'AIzaSyCNtMrkX8I2x-5taJn_j9JF3Ax_p9kPYFc';
    
    console.log('🔍 Probando API key directamente...');
    console.log('🔑 Key:', apiKey.substring(0, 15) + '...');
    
    // URL de la API de Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Responde con "OK"'
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ API key válida:', data);
    return {
      success: true,
      data: data
    };
    
  } catch (error: any) {
    console.error('❌ Error probando API key:', error.message || error);
    return {
      success: false,
      error: error.message || 'Error desconocido'
    };
  }
};

/**
 * Analiza imágenes del vehículo
 */
export const analyzeVehicleImage = async (imagesBase64: string[]) => {
  try {
    console.log('🚀 Analizando imagen de vehículo...');
    
    const genAI = await initializeGoogleAI();
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro-vision',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      }
    });

    const prompt = `Eres un experto en vehículos. Analiza la imagen y extrae información en JSON:

{
  "plate": "número de placa",
  "make": "marca",
  "model": "modelo",
  "year": año,
  "color": "color",
  "type": "tipo"
}

Solo responde con JSON.`;

    const imageParts = imagesBase64.map(base64 => ({
      inlineData: {
        data: base64.includes('base64,') ? base64.split(',')[1] : base64,
        mimeType: 'image/jpeg',
      },
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No se pudo extraer JSON');

    const parsedData = JSON.parse(jsonMatch[0]);
    
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
    
  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
    return {
      success: false,
      error: error.message || 'Error procesando imagen',
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
 * Analiza documentos
 */
export const analyzeDocumentImage = async (imageBase64: string, docType: string) => {
  try {
    console.log(`🚀 Analizando documento: ${docType}...`);
    
    const genAI = await initializeGoogleAI();
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro-vision',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      }
    });

    const prompt = docType === 'Cédula' 
      ? `Analiza la cédula vehicular y extrae datos en JSON:
         { "plate": "placa", "vin": "chasis", "motorNum": "motor", "year": año }`
      : `Analiza el seguro y extrae datos en JSON:
         { "issuer": "aseguradora", "policyNumber": "póliza", "expirationDate": "vencimiento" }`;

    const cleanBase64 = imageBase64.includes('base64,') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: 'image/jpeg',
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No se pudo extraer JSON');

    const parsedData = JSON.parse(jsonMatch[0]);
    
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
    
  } catch (error: any) {
    console.error(`❌ Error (${docType}):`, error.message || error);
    return {
      success: false,
      error: error.message || 'Error procesando documento',
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
 * Función temporal para baterías
 */
export const analyzeBatteryImage = async () => {
  console.log('⚠️ analyzeBatteryImage: función temporal');
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { brand: null, serialNumber: null };
};

/**
 * Función temporal para extintores
 */
export const analyzeExtinguisherLabel = async () => {
  console.log('⚠️ analyzeExtinguisherLabel: función temporal');
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { expirationDate: null };
};

/**
 * Función temporal para presupuestos
 */
export const analyzeBudgetImage = async () => {
  console.log('⚠️ analyzeBudgetImage: función temporal');
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { workshop: null, totalAmount: null, items: [] };
};

/**
 * Función temporal para facturas
 */
export const analyzeInvoiceImage = async () => {
  console.log('⚠️ analyzeInvoiceImage: función temporal');
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { invoiceNumber: null, date: null, supplier: null };
};

/**
 * Obtiene estado de Google AI
 */
export const getGeminiStatus = async () => {
  try {
    const testResult = await testGeminiConnection();
    const apiTest = await testApiKeyDirectly();
    
    return {
      geminiAvailable: testResult.success,
      apiKeyValid: apiTest.success,
      geminiMessage: testResult.message || testResult.error,
      apiKeyMessage: apiTest.success ? 'API key válida' : apiTest.error,
      apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY ? 'Configurada' : 'Usando clave directa',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      geminiAvailable: false,
      apiKeyValid: false,
      geminiMessage: error.message || 'Error desconocido',
      apiKeyMessage: 'No se pudo verificar',
      apiKey: 'Error',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Verifica disponibilidad simple
 */
export const isGeminiAvailable = async () => {
  try {
    const status = await getGeminiStatus();
    return status.geminiAvailable && status.apiKeyValid;
  } catch {
    return false;
  }
};
