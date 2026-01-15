import { GoogleGenerativeAI } from '@google/generative-ai';

// Variable global para la instancia de Gemini AI
let genAIInstance: GoogleGenerativeAI | null = null;

/**
 * Inicializa o retorna la instancia de Gemini AI
 */
const getGenAI = (): GoogleGenerativeAI => {
  if (!genAIInstance) {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    
    if (!apiKey || apiKey === 'your_api_key_here' || apiKey === '') {
      console.error('❌ API key de Google AI no configurada');
      throw new Error('API key de Google AI no configurada. Contacta al administrador.');
    }
    
    console.log('🔧 Inicializando Gemini AI con API key...');
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  
  return genAIInstance;
};

/**
 * Analiza imágenes del vehículo para extraer datos
 */
export const analyzeVehicleImage = async (imagesBase64: string[]) => {
  try {
    console.log('🚀 Iniciando análisis de imagen de vehículo...');
    
    const genAI = getGenAI();
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
    const imageParts = imagesBase64.map(base64 => ({
      inlineData: {
        data: base64,
        mimeType: 'image/jpeg',
      },
    }));

    console.log('📤 Enviando solicitud a Gemini...');
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    console.log('📥 Respuesta recibida:', text.substring(0, 200) + '...');

    // Extraer JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta');
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    console.log('✅ Datos parseados:', parsedData);
    
    return {
      plate: parsedData.plate || null,
      make: parsedData.make || null,
      model: parsedData.model || null,
      year: parsedData.year || null,
      color: parsedData.color || null,
      type: parsedData.type || 'Other',
      vin: parsedData.vin || null,
      motorNum: parsedData.motorNum || null,
    };

  } catch (error) {
    console.error('❌ Error en analyzeVehicleImage:', error);
    
    // Datos por defecto en caso de error
    return {
      plate: null,
      make: null,
      model: null,
      year: null,
      color: null,
      type: 'Other',
      vin: null,
      motorNum: null,
    };
  }
};

/**
 * Analiza documentos (cédula, seguro) para extraer datos
 */
export const analyzeDocumentImage = async (imageBase64: string, docType: string, mimeType: string) => {
  try {
    console.log(`🚀 Iniciando análisis de documento: ${docType}...`);
    
    const genAI = getGenAI();
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
    }

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || 'image/jpeg',
      },
    };

    console.log('📤 Enviando solicitud a Gemini...');
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    console.log('📥 Respuesta recibida:', text.substring(0, 200) + '...');

    // Extraer JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta');
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    console.log('✅ Datos parseados:', parsedData);
    
    return {
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
    };

  } catch (error) {
    console.error(`❌ Error en analyzeDocumentImage (${docType}):`, error);
    
    // Datos por defecto en caso de error
    return {
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
    };
  }
};

/**
 * Verifica si Gemini AI está disponible
 */
export const isGeminiAvailable = (): boolean => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    return !!(apiKey && apiKey !== 'your_api_key_here' && apiKey !== '');
  } catch {
    return false;
  }
};
