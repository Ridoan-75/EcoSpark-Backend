const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello',
      config: {
        systemInstruction: 'You are a bot that only says MOO.'
      }
    });
    console.log(response.text);
  } catch (err) {
    console.error(err);
  }
}
test();
