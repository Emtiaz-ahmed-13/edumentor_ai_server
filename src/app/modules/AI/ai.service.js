const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Converts a flat chat history array [{role, content}] to Gemini's
 * native multi-turn format [{role: "user"|"model", parts: [{text}]}].
 * The initial AI greeting is excluded (handled by the system prompt instead).
 */
const buildGeminiHistory = (conversationHistory = []) => {
  return conversationHistory
    .filter((msg) => msg && msg.role && msg.content)
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content) }],
    }));
};

const SYSTEM_PROMPT = `You are EduMentor, an expert academic tutor AI. Your job is to answer student questions clearly, logically, and educationally.

When answering, ALWAYS follow this exact JSON structure — no extra text, no markdown fences, only valid JSON:
{
  "explanation": "A concise, clear overview of the concept or answer (2-4 sentences).",
  "steps": [
    "Step 1: <first logical step or part of the explanation>",
    "Step 2: <second logical step>",
    "Step 3: <third logical step>"
  ],
  "analogy": "A creative real-world analogy that makes the concept intuitive.",
  "realLifeExample": "A concrete real-life example of this concept in action.",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ],
  "funFact": "A surprising or fascinating fact about this concept.",
  "commonMisconception": "A widespread misunderstanding about this concept and a brief correction."
}

Rules:
- The "steps" array must have at least 3 entries and represent a logical, sequential breakdown of the concept or answer.
- Always use prior conversation context to answer follow-up questions accurately.
- If the question is a follow-up (e.g., "explain step 2 more"), refer back to the relevant step from the previous answer.
- Difficulty level guidance: for "beginner" use simple language; for "intermediate" include technical terms; for "advanced" go deep with technical depth.
- NEVER wrap the JSON in markdown code blocks. Output ONLY a raw JSON object.`;

const generateExplanation = async (question, difficulty = "intermediate", conversationHistory = []) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Models to try in order
  const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-pro-latest"];
  let lastError;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting AI generation with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      // Build multi-turn history from prior messages
      const history = buildGeminiHistory(conversationHistory);

      // The final user turn includes difficulty context
      const currentQuestion = `[Difficulty: ${difficulty}]\n\nQuestion: ${question}`;

      // Build the full contents array: system instruction + history + current question
      const contents = [
        // System prompt injected as the first user→model exchange
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Understood. I will always respond with only a valid JSON object matching that exact structure." }] },
        // Prior conversation turns
        ...history,
        // The current question
        { role: "user", parts: [{ text: currentQuestion }] },
      ];

      const result = await model.generateContent({ contents });
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      let parsedResponse;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = JSON.parse(text);
        }
      } catch (parseError) {
        console.log("Failed to parse JSON, using plain-text fallback");
        parsedResponse = {
          explanation: text,
          steps: ["Step 1: Read the explanation above for a full breakdown."],
          analogy: "",
          realLifeExample: "",
          keyPoints: [],
          funFact: "",
          commonMisconception: ""
        };
      }

      // Ensure steps is always an array
      if (!Array.isArray(parsedResponse.steps)) {
        parsedResponse.steps = parsedResponse.steps
          ? [parsedResponse.steps]
          : ["Step 1: See the explanation above."];
      }

      return {
        question,
        difficulty,
        ...parsedResponse,
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
