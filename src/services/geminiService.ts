import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini with environment variable
let ai: GoogleGenAI | null = null;

try {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  console.log('🔑 Gemini API Key configurada:', apiKey ? 'SÍ' : 'NO');
  
  if (apiKey && apiKey.trim() !== '') {
    ai = new GoogleGenAI({ apiKey });
    console.log('✅ Google AI inicializado correctamente');
  } else {
    console.warn('⚠️ Google AI API key no configurada');
  }
} catch (error) {
  console.error('❌ Error inicializando Google AI:', error);
}

const MODEL_NAME = 'gemini-2.5-flash';

// Helper function to check if AI is available
const isAIAvailable = () => {
  if (!ai) {
    console.warn('⚠️ Google AI no está disponible');
    return false;
  }
  return true;
};

/**
 * Extracts vehicle data from images (Registration Card Front/Back or Vehicle Photo).
 * Accepts an array of base64 strings.
 */
export const analyzeVehicleImage = async (base64Images: string[]) => {
  console.log('📸 analyzeVehicleImage llamado con', base64Images.length, 'imágenes');
  console.log('📏 Tamaño de la primera imagen (base64):', base64Images[0]?.length || 0, 'caracteres');
  
  if (!isAIAvailable()) {
    console.warn('🚫 Google AI no disponible, retornando datos por defecto');
    return {
      plate: '',
      make: '',
      model: '',
      year: null,
      vin: '',
      motorNum: '',
      type: 'Other'
    };
  }
  
  try {
    console.log('🚀 Enviando imágenes a Gemini...');
    
    const imageParts = base64Images.map((b64, index) => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: b64
      }
    }));

    const response = await ai!.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          ...imageParts,
          {
            text: "Analyze these images (Vehicle Registration/Cédula or Car Photo). Extract: Plate, Make, Model, Year. For 'Type', strictly categorize into one of these exact values: 'Sedan', 'Pickup', 'SUV', 'Van', 'Truck', 'Other'. Also extract VIN and Motor Number. Return JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plate: { type: Type.STRING, description: "Vehicle license plate/matricula" },
            make: { type: Type.STRING, description: "Manufacturer brand" },
            model: { type: Type.STRING, description: "Model name" },
            year: { type: Type.NUMBER, description: "Year of manufacture" },
            vin: { type: Type.STRING, description: "Chassis number / VIN" },
            motorNum: { type: Type.STRING, description: "Engine/Motor Number" },
            type: { type: Type.STRING, description: "One of: Sedan, Pickup, SUV, Van, Truck, Other" }
          }
        }
      }
    });

    console.log('✅ Respuesta de Gemini recibida:', response.text);
    const result = JSON.parse(response.text || '{}');
    console.log('📊 Resultado parseado:', result);
    return result;
  } catch (error) {
    console.error("❌ Gemini Vehicle Analysis Error:", error);
    return {
      plate: '',
      make: '',
      model: '',
      year: null,
      vin: '',
      motorNum: '',
      type: 'Other'
    };
  }
};

// ... (las otras funciones mantienen logs similares) ...
