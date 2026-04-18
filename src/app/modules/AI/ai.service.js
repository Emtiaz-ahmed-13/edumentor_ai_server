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

Difficulty level controls depth and complexity:
- "beginner": Simple, jargon-free language. Use everyday analogies. Provide exactly 3 clear steps.
- "intermediate": Include correct technical terms. Provide 4–5 steps with some depth.
- "advanced": Full technical depth, trade-offs, edge cases, formal terminology. Provide 5–7 rich steps.

Always detect the academic subject (e.g., Computer Science, Mathematics, Physics, Biology, Chemistry, History, Economics, etc.).

When answering, ALWAYS return ONLY this exact JSON structure — no markdown, no extra text, only valid JSON:
{
  "subject": "The detected academic subject (e.g., Computer Science)",
  "explanation": "A concise, clear overview of the concept (2–4 sentences). Adapts depth to difficulty level.",
  "steps": [
    "Step 1 - Label: Detailed explanation of this logical step.",
    "Step 2 - Label: Continue the logical breakdown.",
    "Step 3 - Label: Conclude the explanation (add more steps for intermediate/advanced)."
  ],
  "analogy": "A creative real-world analogy that makes the concept immediately intuitive.",
  "realLifeExample": "A concrete real-life application or example of this concept.",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3",
    "Key point 4"
  ],
  "funFact": "A surprising or fascinating fact about this concept.",
  "commonMisconception": "A widespread misunderstanding about this topic and a brief correction.",
  "followUpQuestions": [
    "A natural follow-up question the student might want to ask next.",
    "Another related follow-up question.",
    "A deeper follow-up question for further exploration."
  ]
}

Additional Rules:
- Always use prior conversation context to answer follow-up questions accurately.
- If the question is a follow-up, refer to the previous answer explicitly.
- NEVER wrap JSON in markdown code blocks. Output ONLY a raw JSON object.`;

const CODE_SYSTEM_PROMPT = `You are EduMentor Code Expert, a world-class software engineer and tutor. Your job is to analyze programming code provided by students.

When analyzing, ALWAYS follow this exact JSON structure — no extra text, no markdown fences, only valid JSON:
{
  "explanation": "A high-level overview of what the code does (2-3 sentences).",
  "bugs": [
    {
      "type": "Syntax/Logic/Performance",
      "description": "Clear description of the bug or issue.",
      "fix": "How to fix it."
    }
  ],
  "optimizations": [
    "Suggestion 1: <how to make it faster or cleaner>",
    "Suggestion 2: <another improvement>"
  ],
  "correctedCode": "The full corrected and optimized version of the code."
}

Rules:
- If there are no bugs, return an empty array for "bugs".
- If no optimizations are needed, return an empty array for "optimizations".
- Ensure "correctedCode" is properly escaped for JSON.
- Difficulty level guidance still applies to the explanation.
- NEVER wrap the JSON in markdown code blocks. Output ONLY a raw JSON object.`;

const generateExplanation = async (question, difficulty = "intermediate", conversationHistory = []) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Models to try in order (gemini-2.5-flash has free tier quota: 5 RPM, 250K TPM)
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-pro",
  ];
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

const analyzeCode = async (code, language = "javascript", difficulty = "intermediate") => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash"];
  let lastError;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `[Language: ${language}, Difficulty: ${difficulty}]\n\nCode to analyze:\n\n${code}`;

      const contents = [
        { role: "user", parts: [{ text: CODE_SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Understood. I will provide a detailed code analysis in the requested JSON format." }] },
        { role: "user", parts: [{ text: prompt }] },
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
        return {
          explanation: "Failed to parse AI response into structured data.",
          bugs: [],
          optimizations: [],
          correctedCode: text,
        };
      }

      return parsedResponse;
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error("All AI models failed to analyze code.");
};

const generateQuiz = async (topic, difficulty = "intermediate", numQuestions = 5) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro"];
  let lastError;

  const quizSystemPrompt = `You are a Quiz Generation AI. Your job is to generate multiple-choice quizzes based on a given topic and difficulty.
Return ONLY a valid JSON array of objects, with each object following this exact structure:
[
  {
    "question": "The question text, avoiding ambiguous wording.",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The exact string from the options array that is correct.",
    "explanation": "A short, 1-2 sentence explanation of why this answer is correct."
  }
]
Do not wrap the array in any markdown or extra text. Generate exactly ${numQuestions} questions.`;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `[Topic: ${topic}, Difficulty: ${difficulty}]\nGenerate the quiz now.`;

      const contents = [
        { role: "user", parts: [{ text: quizSystemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I will generate a JSON array of multiple-choice questions." }] },
        { role: "user", parts: [{ text: prompt }] }
      ];

      const result = await model.generateContent({ contents });
      const response = await result.response;
      const text = response.text();

      let parsedResponse;
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        parsedResponse = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        throw new Error("Failed to parse AI response as JSON array.");
      }

      return parsedResponse;
    } catch (error) {
      lastError = error;
      continue;
    }
  }
  throw lastError || new Error("All AI models failed to generate quiz.");
};

const evaluateAnswer = async (question, userAnswer) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro"];
  let lastError;

  const evaluatorSystemPrompt = `You are an AI Answer Evaluator for an educational platform.
Evaluation criteria: Clarity, accuracy, depth, and structural logic.
Return ONLY a valid JSON object matching this exact structure:
{
  "score": 8, // A number between 0 and 10
  "strengths": ["Point 1", "Point 2"], // Array of positive aspects
  "keyMissingPoints": ["Point 1", "Point 2"], // Array of missing or incorrect points
  "improvements": ["Tip 1", "Tip 2"], // Array of specific tips for improvement
  "suggestedAnswer": "A concise, high-quality sample answer that would earn 10/10."
}
Do not wrap the JSON in markdown or extra text.`;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `[Question: ${question}]\n\n[Student Answer: ${userAnswer}]\n\nPlease evaluate the student's answer.`;

      const contents = [
        { role: "user", parts: [{ text: evaluatorSystemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I will evaluate the answer and return only a JSON object." }] },
        { role: "user", parts: [{ text: prompt }] }
      ];

      const result = await model.generateContent({ contents });
      const response = await result.response;
      const text = response.text();

      let parsedResponse;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsedResponse = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        throw new Error("Failed to parse AI response as JSON object.");
      }

      return parsedResponse;
    } catch (error) {
      lastError = error;
      continue;
    }
  }
  throw lastError || new Error("All AI models failed to evaluate the answer.");
};

module.exports = {
  generateExplanation,
  analyzeCode,
  generateQuiz,
  evaluateAnswer,
};
