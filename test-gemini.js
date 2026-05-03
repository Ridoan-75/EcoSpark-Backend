import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ path: "c:\\Users\\Admin\\OneDrive\\Desktop\\EcoSpark Backend\\.env" });

const ai = new GoogleGenAI({ apiKey: process.env.ANTHROPIC_API_KEY });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello",
      config: {
        systemInstruction: "You are a bot.",
        temperature: 0.7,
      },
    });
    console.log("Success:", response.text);
  } catch (err) {
    console.error("Error connecting to Gemini:");
    console.error(err);
  }
}

test();
