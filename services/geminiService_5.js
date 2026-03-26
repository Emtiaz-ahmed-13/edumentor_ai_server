const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT =
  "You are EduMentor, a professional and encouraging AI Tutor. Explain concepts clearly with helpful examples using a friendly educational tone. Keep answers concise and well-structured.";

const generateAIResponse = async (prompt) => {
  const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-001"];

  for (const modelName of modelsToTry) {
    try {
      console.log(`[EduMentor AI] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nUser: ${prompt}`);
      const text = result.response.text();
      if (text) {
        console.log(`[EduMentor AI] ✓ Success with ${modelName}`);
        return text;
      }
    } catch (error) {
      // Rate limit — skip to next model immediately, no waiting
      const isRateLimit =
        error.message &&
        (error.message.includes("429") ||
          error.message.includes("RetryInfo") ||
          error.message.includes("RESOURCE_EXHAUSTED"));

      if (isRateLimit) {
        console.warn(`[EduMentor AI] ⚠ Rate limited on ${modelName}, trying next model...`);
        continue; // immediately try next model
      }

      // Other errors (404, auth, etc.) — also skip to next model
      console.error(`[EduMentor AI] ✗ Error on ${modelName}:`, error.message.substring(0, 100));
      continue;
    }
  }

  throw new Error("All AI models are currently busy. Please wait a moment and try again.");
};

module.exports = { generateAIResponse };
