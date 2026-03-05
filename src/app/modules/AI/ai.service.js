const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateExplanation = async (question, difficulty = "intermediate") => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an expert academic tutor.
    The user is asking a question at a "${difficulty}" difficulty level.
    
    Question: "${question}"
    
    Please provide a structured, clear, and educational explanation appropriate for a ${difficulty} level.
  `;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  return {
    question,
    difficulty,
    explanation: text,
  };
};

module.exports = {
  generateExplanation,
};
