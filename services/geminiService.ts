
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { Destination, Coordinates } from "../types";

// Inicialização recomendada
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Função utilitária para lidar com limites de quota (Erro 429) usando backoff exponencial.
 */
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error.message?.includes('429') || error.status === 429 || error.message?.includes('quota');
      
      if (isRateLimit && i < maxRetries - 1) {
        // Espera: 1s, 2s, 4s... com um jitter aleatório
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// Declaração da ferramenta de GPS solicitada
const obterLocalizacaoGPSDeclaration: FunctionDeclaration = {
  name: 'obterLocalizacaoGPS',
  parameters: {
    type: Type.OBJECT,
    description: 'Obtém as coordenadas geográficas precisas (latitude e longitude) atuais do utilizador através do GPS do hardware.',
    properties: {},
  },
};

export const getSmartDestinations = async (query: string, location?: Coordinates): Promise<Destination[]> => {
  try {
    // Explicitly typing response to fix 'unknown' type error when calling ai.models.generateContent
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `User Location: Lat ${location?.lat || 0}, Lng ${location?.lng || 0}. Query: "${query}".`,
      config: {
        systemInstruction: "You are a professional Peugeot E2008 GT navigation system. Generate a list of 3 specific and realistic destination options based on the user's query and current location. For each destination, provide precise route details: distance, duration, and estimated battery percentage usage.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              address: { type: Type.STRING },
              distance: { type: Type.STRING },
              duration: { type: Type.STRING },
              batteryUsage: { type: Type.NUMBER },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER }
            },
            required: ["name", "address", "distance", "duration", "batteryUsage", "lat", "lng"]
          }
        }
      }
    }));
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error;
  }
};

/**
 * Serviço do Assistente com suporte a Function Calling para GPS Real
 */
export const askAssistant = async (query: string, history: any[] = []): Promise<GenerateContentResponse> => {
  try {
    // Explicitly typing response to fix 'unknown' type error when calling ai.models.generateContent
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [...history, { role: 'user', parts: [{ text: query }] }],
      config: {
        systemInstruction: `Tu és um assistente inteligente integrado num sistema de navegação premium (Peugeot E2008 GT).
REGRAS CRÍTICAS:
1. Nunca adivinhes a localização do utilizador.
2. Se o utilizador perguntar "onde estou", "qual a minha posição" ou algo relativo a GPS, chama a função "obterLocalizacaoGPS" IMEDIATAMENTE.
3. Responde de forma concisa e elegante.
4. Não inventes coordenadas se a função falhar.`,
        tools: [{ functionDeclarations: [obterLocalizacaoGPSDeclaration] }],
      },
    }));

    return response;
  } catch (error) {
    console.error("Assistant Service Error:", error);
    throw error;
  }
};
