const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  console.log("Listing available models...");
  try {
    // Note: The Node.js SDK doesn't have a direct listModels method on the genAI object in all versions.
    // We can try to use the REST API via fetch if the SDK doesn't support it, but let's check the SDK first.
    // Actually, in @google/generative-ai, listing models is usually done via the fetch API to the /models endpoint.
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("AVAILABLE MODELS:");
      data.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
    } else {
      console.log("No models found or error in response:", data);
    }
  } catch (error) {
    console.error("LIST MODELS ERROR:", error);
  }
}

listModels();
