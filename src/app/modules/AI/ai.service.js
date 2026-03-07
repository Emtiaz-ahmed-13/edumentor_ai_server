const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * AI Service - Gemini AI Integration
 * Student: Syed Muntazir Mehdi (ID: 22299525)
 * Feature 4 - EduMentor AI
 */

const generateExplanation = async (question, difficulty = "intermediate") => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }

  // List of models to try in order
  const modelsToTry = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-pro-latest",
  ];
  let lastError;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting AI generation with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `
        You are an expert academic tutor for EduMentor AI (Student ID: 22299525).
        A student is asking about the following concept at a "${difficulty}" difficulty level.

        Topic: "${question}"

        Your task is to make this concept crystal-clear for a ${difficulty}-level student.
        Tailor the vocabulary, depth, and examples to their level:
        - beginner: use everyday language, very simple examples, no jargon
        - intermediate: some technical terms with explanations, moderate depth
        - advanced: full technical depth, precise definitions, edge cases

        Return ONLY a valid JSON object with these exact fields:
        {
          "explanation": "A clear, direct explanation of the concept suitable for ${difficulty} level (2-4 sentences)",
          "realLifeExample": "A concrete real-world scenario that illustrates this concept in everyday life (2-3 sentences)",
          "analogy": "A creative comparison that makes the concept intuitive and memorable (2-3 sentences)",
          "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
          "funFact": "A surprising or fascinating fact about this concept that students will remember (1-2 sentences)",
          "commonMisconception": "A widespread misunderstanding about this concept and a brief correction (2-3 sentences)"
        }

        IMPORTANT: Return ONLY the JSON object. No markdown, no code fences, no extra text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse response JSON
      let parsedResponse;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = JSON.parse(text);
        }
      } catch (parseError) {
        console.log("Failed to parse JSON, using fallback structure");
        parsedResponse = {
          explanation: text,
          realLifeExample: "See explanation above for context.",
          analogy: "Think of it as a system with interconnected parts working together.",
          keyPoints: ["Review the explanation above for key insights."],
          funFact: "This concept has fascinating applications across many fields.",
          commonMisconception:
            "Many people confuse this with related concepts — the explanation above clarifies the distinction.",
        };
      }

      // Ensure all required fields exist
      const safeResponse = {
        explanation: parsedResponse.explanation || text,
        realLifeExample: parsedResponse.realLifeExample || "",
        analogy: parsedResponse.analogy || "",
        keyPoints: Array.isArray(parsedResponse.keyPoints)
          ? parsedResponse.keyPoints
          : [],
        funFact: parsedResponse.funFact || "",
        commonMisconception: parsedResponse.commonMisconception || "",
      };

      return {
        question,
        difficulty,
        ...safeResponse,
      };
    } catch (error) {
      console.error(`Failed with model ${modelName}:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error("All AI models failed to generate a response.");
};

module.exports = {
  generateExplanation,
};
