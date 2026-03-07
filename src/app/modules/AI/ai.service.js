const { GoogleGenerativeAI } = require("@google/generative-ai");

const generateExplanation = async (question, difficulty = "intermediate") => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }

  // List of models verified available via diagnostic script
  const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-pro-latest"];
  let lastError;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting AI generation with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `
        You are an expert academic tutor.
        The user is asking a question at a "${difficulty}" difficulty level.
        
        Question: "${question}"
        
        Please provide a structured, clear, and educational explanation appropriate for a ${difficulty} level.
        
        Return your response as a JSON object with these exact fields:
        {
          "explanation": "A clear, simple explanation of the concept",
          "realLifeExample": "A real-life example that illustrates the concept",
          "analogy": "An analogy that makes the concept easier to understand",
          "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4"]
        }
        
        Make sure the response is valid JSON with no additional text.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse the JSON response
      let parsedResponse;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = JSON.parse(text);
        }
      } catch (parseError) {
        console.log("Failed to parse JSON, using fallback");
        // If JSON parsing fails, create a structured response from the text
        parsedResponse = {
          explanation: text,
          realLifeExample: "See explanation above",
          analogy: "See explanation above",
          keyPoints: [text.substring(0, 100) + "..."]
        };
      }

      return {
        question,
        difficulty,
        ...parsedResponse
      };
    } catch (error) {
      console.error(`Failed with model ${modelName}:`, error.message);
      lastError = error;
      // If it's not a 404/model error, we might want to break, but let's try all for now
      continue; 
    }
  }

  throw lastError || new Error("All AI models failed to generate a response.");
};

module.exports = {
  generateExplanation,
};

