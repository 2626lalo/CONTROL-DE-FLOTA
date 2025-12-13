
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini
// NOTE: Ideally, process.env.API_KEY should be set. 
// For this environment, we rely on the system injecting it.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Extracts vehicle data from images (Registration Card Front/Back or Vehicle Photo).
 * Accepts an array of base64 strings.
 */
export const analyzeVehicleImage = async (base64Images: string[]) => {
  try {
    const imageParts = base64Images.map(b64 => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: b64
      }
    }));

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          ...imageParts,
          {
            text: "Analyze these images. They are likely the front and back of a vehicle registration card (Cédula) or vehicle photos. Extract the Plate (Matricula/Dominio), Make (Marca), Model (Modelo), Year (Año), VIN/Chassis, Motor Number (Nro Motor), and Type (Sedan, Pickup, etc). Return JSON."
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
            type: { type: Type.STRING, description: "Type of vehicle (e.g. Pickup, Sedan)" }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Vehicle Analysis Error:", error);
    return null;
  }
};

/**
 * Extracts document data (Insurance, VTV, etc) specifically looking for dates and policy info.
 */
export const analyzeDocumentImage = async (base64Image: string, docType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: `Analyze this ${docType} document. Extract the expiration date (Vencimiento), the issuing company or entity name. IMPORTANT: If it is an Insurance document, look for the Policy Number (Número de Póliza) and Client/Associate Number (Número de Cliente / Socio). Also look for Vehicle Model Year if visible. Return JSON.`
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

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Doc Analysis Error:", error);
    return null;
  }
};

/**
 * Analyzes a damage photo for the checklist/service request.
 */
export const analyzeDamage = async (base64Image: string) => {
  try {
     const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Briefly describe the vehicle damage or mechanical issue visible in this photo for a maintenance report." }
        ]
      }
    });
    return response.text;
  } catch (error) {
    return "Could not analyze image.";
  }
}

/**
 * Analyzes a fire extinguisher label to extract expiration date.
 */
export const analyzeExtinguisherLabel = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Analyze this fire extinguisher label. Look for the Expiration Date (Vencimiento) or Manufacturing Date (Fabricación) to calculate validity. Usually valid for 1 year from service/manufacture. Return the specific EXPIRATION DATE found or calculated. Return JSON." }
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
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Extinguisher Analysis Error:", error);
    return null;
  }
}

/**
 * Analyzes a battery label to extract Brand and Serial Number.
 */
export const analyzeBatteryImage = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
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
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Battery Analysis Error:", error);
    return null;
  }
}

/**
 * Analyzes a budget/quote image to extract provider, cost, and budget number.
 */
export const analyzeBudgetImage = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Analyze this service quote/budget/invoice. Extract the Provider Name, the Total Cost, the Budget/Quote Number (Nro Presupuesto), and a brief summary of the work items. Return JSON." }
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
             details: { type: Type.STRING, description: "Summary of tasks or items" }
           }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Budget Analysis Error:", error);
    return null;
  }
}

/**
 * Analyzes an invoice image to extract Invoice Number and Total Amount.
 */
export const analyzeInvoiceImage = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
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
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Invoice Analysis Error:", error);
    return null;
  }
}
