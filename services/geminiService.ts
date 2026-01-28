
import { GoogleGenAI, Type } from "@google/genai";

/**
 * PROTOCOLO DE INTELIGENCIA v36.0
 * Cliente centralizado para servicios de IA generativa.
 */
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const isAiAvailable = () => {
  return !!process.env.API_KEY;
};

export const analyzeDocumentImage = async (base64: string, side: 'Frente' | 'Dorso') => {
  const ai = getAiClient();
  const prompt = side === 'Frente' 
    ? "Analiza el FRENTE de esta cédula vehicular. Extrae en JSON: plate (patente), make (marca), model (modelo)."
    : "Analiza el DORSO de esta cédula vehicular. Extrae en JSON: ownerName (titular), ownerAddress (domicilio), motorNum (motor), vin (chasis).";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64.includes('base64,') ? base64.split(',')[1] : base64 } },
          { text: prompt }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plate: { type: Type.STRING },
            make: { type: Type.STRING },
            model: { type: Type.STRING },
            vin: { type: Type.STRING },
            motorNum: { type: Type.STRING },
            ownerName: { type: Type.STRING },
            ownerAddress: { type: Type.STRING }
          }
        }
      }
    });
    const text = response.text;
    if (!text) throw new Error("Respuesta vacía de IA");
    return { success: true as const, data: JSON.parse(text) };
  } catch (error) {
    console.error("AI OCR Error:", error);
    return { success: false as const, error: "FALLO_ANALISIS_IA" };
  }
};

export const analyzeBudgetImage = async (base64: string, mimeType: string) => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64.includes('base64,') ? base64.split(',')[1] : base64 } },
          { text: "Analiza este presupuesto y devuelve JSON: provider, totalCost (número), details (resumen técnico de lo presupuestado)." }
        ]
      }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            provider: { type: Type.STRING },
            totalCost: { type: Type.NUMBER },
            details: { type: Type.STRING }
          },
          required: ["provider", "totalCost"]
        }
      }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("AI Budget Error:", error);
    return null;
  }
};

export const getTechnicalAdvice = async (issue: string, vehicleInfo: string) => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Actúa como un experto mecánico jefe de flota corporativa. Analiza este problema reportado: "${issue}" para el vehículo: ${vehicleInfo}. 
      Proporciona un diagnóstico técnico preliminar, sugiere repuestos probables y califica la urgencia (Baja/Media/Alta/Crítica). 
      Responde en español de forma profesional y concisa.`
    });
    return response.text || "No se pudo generar el consejo técnico en este momento.";
  } catch (error) {
    console.error("AI Advice Error:", error);
    return "Error de conexión con el asesor técnico IA.";
  }
};

export const getFleetHealthReport = async (vehiclesData: string) => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Realiza un análisis gerencial de la salud de esta flota: ${vehiclesData}. 
      Identifica los 3 riesgos operativos principales (mantenimiento, legal/documental, antigüedad) y propón una acción correctiva prioritaria para el Fleet Manager.
      Utiliza un tono ejecutivo, profesional y estructurado en español.`
    });
    return response.text || null;
  } catch (error) {
    console.error("AI Fleet Health Error:", error);
    return null;
  }
}
