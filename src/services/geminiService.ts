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
    
    const imageParts = base64Images.map(b64 => ({
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

    console.log('✅ Respuesta de Gemini recibida');
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

/**
 * Extracts document data (Insurance, VTV, etc) specifically looking for dates and policy info.
 * Supports Images and PDF.
 */
export const analyzeDocumentImage = async (base64Data: string, docType: string, mimeType: string = 'image/jpeg') => {
  console.log('📄 analyzeDocumentImage llamado para', docType);
  
  if (!isAIAvailable()) {
    console.warn('🚫 Google AI no disponible, retornando datos por defecto');
    return {
      expirationDate: '',
      issuer: '',
      identifier: '',
      policyNumber: '',
      clientNumber: '',
      year: null,
      isValid: false
    };
  }
  
  try {
    console.log('🚀 Enviando documento a Gemini...');
    
    const response = await ai!.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Analyze this ${docType} document. Extract the expiration date (Vencimiento). If it is an Insurance (Seguro) document, CRITICAL: Find the 'Model Year' (Año del vehículo) listed on the policy and the Policy Number. Return JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            expirationDate: { type: Type.STRING, description: "Expiration date in YYYY-MM-DD format" },
            issuer: { type: Type.STRING, description: "Name of the issuing entity, insurance company, or organization" },
            identifier: { type: Type.STRING, description: "Any general identifier found" },
            policyNumber: { type: Type.STRING, description: "Insurance Policy Number if present" },
            clientNumber: { type: Type.STRING, description: "Client or Associate Number if present" },
            year: { type: Type.NUMBER, description: "Vehicle model year if present in document" },
            isValid: { type: Type.BOOLEAN, description: "Does the document look valid and readable?" }
          }
        }
      }
    });

    console.log('✅ Respuesta de Gemini recibida para documento');
    const result = JSON.parse(response.text || '{}');
    console.log('📊 Resultado documento:', result);
    return result;
  } catch (error) {
    console.error("❌ Gemini Doc Analysis Error:", error);
    return {
      expirationDate: '',
      issuer: '',
      identifier: '',
      policyNumber: '',
      clientNumber: '',
      year: null,
      isValid: false
    };
  }
};

/**
 * Analyzes a damage photo for the checklist/service request.
 */
export const analyzeDamage = async (base64Image: string) => {
  console.log('🔧 analyzeDamage llamado');
  
  if (!isAIAvailable()) {
    console.warn('🚫 Google AI no disponible');
    return "La función de análisis de daños no está disponible. Configure la clave de API de Google AI.";
  }
  
  try {
    console.log('🚀 Enviando imagen de daño a Gemini...');
    
    const response = await ai!.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Briefly describe the vehicle damage or mechanical issue visible in this photo for a maintenance report." }
        ]
      }
    });
    
    console.log('✅ Respuesta de daño recibida');
    return response.text;
  } catch (error) {
    console.error('❌ Error analizando daño:', error);
    return "No se pudo analizar la imagen.";
  }
};

/**
 * Analyzes a fire extinguisher label to extract expiration date.
 */
export const analyzeExtinguisherLabel = async (base64Image: string) => {
  console.log('🧯 analyzeExtinguisherLabel llamado');
  
  if (!isAIAvailable()) {
    console.warn('🚫 Google AI no disponible');
    return {
      expirationDate: '',
      isValid: false
    };
  }
  
  try {
    console.log('🚀 Enviando imagen de extintor a Gemini...');
    
    const response = await ai!.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Analyze this fire extinguisher label. Look for the Expiration Date (Vencimiento) or Manufacturing Date (Fabricación) to calculate validity. Usually valid for 1 year from service/manufacture. Return the specific EXPIRATION DATE found or calculated in YYYY-MM-DD format. Return JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            expirationDate: { type: Type.STRING, description: "Expiration date in YYYY-MM-DD format" },
            isValid: { type: Type.BOOLEAN, description: "Is the date clearly visible?" }
          }
        }
      }
    });
    
    console.log('✅ Respuesta de extintor recibida');
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("❌ Gemini Extinguisher Analysis Error:", error);
    return {
      expirationDate: '',
      isValid: false
    };
  }
};

/**
 * Analyzes a battery label to extract Brand and Serial Number.
 */
export const analyzeBatteryImage = async (base64Image: string) => {
  console.log('🔋 analyzeBatteryImage llamado');
  
  if (!isAIAvailable()) {
    console.warn('🚫 Google AI no disponible');
    return {
      brand: '',
      serialNumber: ''
    };
  }
  
  try {
    console.log('🚀 Enviando imagen de batería a Gemini...');
    
    const response = await ai!.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Analyze this car battery photo. Extract the Brand (Marca) and the Serial Number (S/N or Number Code) or Batch Code visible on the label or stamped on the plastic. Return JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING, description: "Brand name of the battery (e.g. Moura, Willard, Bosch)" },
            serialNumber: { type: Type.STRING, description: "Serial number, batch code or identification code found" }
          }
        }
      }
    });
    
    console.log('✅ Respuesta de batería recibida');
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("❌ Gemini Battery Analysis Error:", error);
    return {
      brand: '',
      serialNumber: ''
    };
  }
};

/**
 * Analyzes a budget/quote image to extract provider, cost, and budget number.
 * Accepts mimeType to support PDFs.
 */
export const analyzeBudgetImage = async (base64Image: string, mimeType: string = 'image/jpeg') => {
  console.log('💰 analyzeBudgetImage llamado');
  
  if (!isAIAvailable()) {
    console.warn('🚫 Google AI no disponible');
    return {
      provider: '',
      totalCost: 0,
      budgetNumber: '',
      details: 'Análisis no disponible. Configure la clave de API de Google AI.'
    };
  }
  
  try {
    console.log('🚀 Enviando imagen de presupuesto a Gemini...');
    
    const response = await ai!.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: "Analyze this service quote/budget/invoice. Extract the Provider Name, the Total Cost, the Budget/Quote Number (Nro Presupuesto), and a brief summary of the work items. IMPORTANT: The 'details' (summary of work items) MUST BE IN SPANISH (Castellano), translate it if the document is in another language. Return JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
           type: Type.OBJECT,
           properties: {
             provider: { type: Type.STRING, description: "Name of the service provider/workshop" },
             totalCost: { type: Type.NUMBER, description: "Total numeric amount" },
             budgetNumber: { type: Type.STRING, description: "Budget or Quote Number identifier" },
             details: { type: Type.STRING, description: "Summary of tasks or items in Spanish" }
           }
        }
      }
    });
    
    console.log('✅ Respuesta de presupuesto recibida');
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("❌ Gemini Budget Analysis Error:", error);
    return {
      provider: '',
      totalCost: 0,
      budgetNumber: '',
      details: 'Error al analizar el documento.'
    };
  }
};

/**
 * Analyzes an invoice image to extract Invoice Number and Total Amount.
 */
export const analyzeInvoiceImage = async (base64Image: string) => {
  console.log('🧾 analyzeInvoiceImage llamado');
  
  if (!isAIAvailable()) {
    console.warn('🚫 Google AI no disponible');
    return {
      invoiceNumber: '',
      amount: 0
    };
  }
  
  try {
    console.log('🚀 Enviando imagen de factura a Gemini...');
    
    const response = await ai!.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Analyze this invoice/receipt. Extract the Invoice Number (Nro Factura) and the Total Amount (Importe Total). Return JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
           type: Type.OBJECT,
           properties: {
             invoiceNumber: { type: Type.STRING, description: "The invoice number, e.g., '0001-00001234'" },
             amount: { type: Type.NUMBER, description: "Total numeric amount of the invoice" }
           }
        }
      }
    });
    
    console.log('✅ Respuesta de factura recibida');
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("❌ Gemini Invoice Analysis Error:", error);
    return {
      invoiceNumber: '',
      amount: 0
    };
  }
};

// Export a function to check if AI is available
export const isGeminiAvailable = () => {
  return isAIAvailable();
};
