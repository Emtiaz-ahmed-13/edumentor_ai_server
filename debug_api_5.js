const { generateAIResponse } = require("./services/geminiService_5");
require("dotenv").config();

async function test() {
  console.log("Testing Gemini API...");
  try {
    const response = await generateAIResponse("Hello, what is EduMentor AI?");
    console.log("Response:", response);
  } catch (error) {
    console.error("FINAL ERROR:", error);
  }
}

test();
