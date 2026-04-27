import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getGeminiResponse = async (prompt: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Context: ${context}\n\nUser Question: ${prompt}`,
      config: {
        systemInstruction: "You are an assistant for Dyatra Hub, an event management platform. Use the provided context to answer questions about events, LED details, checklists, rentals, and media. If the data is not in the context, say you don't have that information yet.",
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I encountered an error while processing your request.";
  }
};
