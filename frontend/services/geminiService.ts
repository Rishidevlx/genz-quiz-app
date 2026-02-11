
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateAIQuizQuestions = async (
  topic: string, 
  description: string, 
  count: number,
  classLevel: string
): Promise<Question[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate ${count} multiple choice questions about "${topic}" for ${classLevel} students. 
                 Context: ${description}. 
                 Make questions appropriate for their academic level.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING, description: "The quiz question text" },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Four multiple choice options"
              },
              correctAnswer: { 
                type: Type.INTEGER, 
                description: "The 0-based index of the correct option" 
              }
            },
            required: ["id", "text", "options", "correctAnswer"]
          }
        }
      }
    });

    const text = response.text.trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating AI quiz:", error);
    throw new Error("Failed to generate quiz questions via AI");
  }
};
