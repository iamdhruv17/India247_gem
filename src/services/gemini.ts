import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const getGeminiResponse = async (prompt: string, systemInstruction?: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are India247 Assistant, a helpful civic platform bot. Help users report issues like potholes, garbage, or water leaks. Be polite, concise, and professional.",
      },
    });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having some trouble connecting to my brain right now. Please try again later.";
  }
};
