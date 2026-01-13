
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Personnel, Rank, Role } from "./types";

// Fixed: Correct initialization using named parameter and direct process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartScaleOptimization = async (
  personnel: Personnel[],
  date: string,
  context: string
): Promise<{ assignments: Record<string, string>, reasoning: string }> => {
  const prompt = `
    Como um oficial de planejamento militar (Sargentiante), otimize a escala operacional do dia ${date}.
    Contexto: ${context}
    
    Militares disponíveis hoje e suas competências aptas:
    ${personnel.map(p => `- ${p.rank} ${p.name} (ID: ${p.id}, Funções Aptas: [${p.roles.join(', ')}], CNH: ${p.canDrive ? 'Sim' : 'Não'})`).join('\n')}
    
    Regras de Negócio OBRIGATÓRIAS:
    1. Comandante: Preferencialmente a maior patente que tenha 'Comandante' em suas competências.
    2. Auxiliar: Segunda maior patente que tenha 'Auxiliar' em suas competências.
    3. Motorista: OBRIGATÓRIO ter CNH e 'Motorista' nas competências.
    4. Patrulheiro e Permanência: Devem ter a respectiva função em suas competências.
    
    Priorize colocar cada militar em uma função que ele esteja apto.
    
    Retorne apenas um JSON estruturado com 'assignments' (Role: ID) e 'reasoning' (justificativa focada na compatibilidade entre patente e competência).
  `;

  try {
    // Fixed: calling generateContent directly on ai.models with the model name as a string
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assignments: {
              type: Type.OBJECT,
              properties: {
                [Role.COMANDANTE]: { type: Type.STRING },
                [Role.AUXILIAR]: { type: Type.STRING },
                [Role.MOTORISTA]: { type: Type.STRING },
                [Role.PATRULHEIRO]: { type: Type.STRING },
                [Role.PERMANENCIA]: { type: Type.STRING },
              }
            },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    // Fixed: accessing response.text property directly
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
