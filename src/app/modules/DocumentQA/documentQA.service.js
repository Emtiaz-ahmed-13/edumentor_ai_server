const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdf = require("pdf-parse");

/**
 * Extracts text from a document buffer based on mimetype.
 */
const extractTextFromBuffer = async (buffer, mimetype) => {
  if (mimetype === "application/pdf") {
    const data = await pdf(buffer);
    return data.text;
  } else if (mimetype === "text/plain") {
    return buffer.toString("utf-8");
  } else {
    throw new Error("Unsupported file type. Please upload a PDF or TXT file.");
  }
};

const SYSTEM_PROMPT = `You are EduMentor, an expert academic tutor AI. Your job is to answer student questions based PROVIDED DOCUMENT CONTEXT.

When answering, ALWAYS follow this exact JSON structure:
{
  "explanation": "A concise, clear answer based on the document (2-4 sentences).",
  "sourceSnippet": "A direct quote or specific section from the document that justifies the answer.",
  "keyPoints": [
    "Key point 1 from the doc",
    "Key point 2 from the doc"
  ],
  "relevanceScore": 1-10 (How well the document relates to the question)
}

Rules:
- If the answer is NOT in the document, state that clearly in the explanation but still try to provide a general educational answer if possible, while noting it's not in the doc.
- NEVER wrap the JSON in markdown code blocks. Output ONLY a raw JSON object.`;

const answerFromDocument = async (context, question, difficulty = "intermediate", conversationHistory = []) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using flash for speed/cost

  // Build prompt with context
  const fullPrompt = `DOCUMENT CONTEXT:
  """
  ${context.substring(0, 30000)} 
  """
  
  [Difficulty: ${difficulty}]
  Question: ${question}`;

  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "Understood. I will answer based on the provided document context using the requested JSON format." }] },
    ...conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    })),
    { role: "user", parts: [{ text: fullPrompt }] },
  ];

  const result = await model.generateContent({ contents });
  const response = await result.response;
  const text = response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (error) {
    console.error("Failed to parse AI response:", text);
    return {
      explanation: text,
      sourceSnippet: "Extraction failed",
      keyPoints: [],
      relevanceScore: 0
    };
  }
};

module.exports = {
  extractTextFromBuffer,
  answerFromDocument,
};
