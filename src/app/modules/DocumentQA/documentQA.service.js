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

/**
 * Helper: Simple keyword-based relevance scoring for chunks.
 */
const getRelevantChunks = (text, question, topK = 5) => {
  const words = text.split(/\s+/);
  const chunks = [];
  const chunkSize = 500;

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }

  const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  const scoredChunks = chunks.map((chunk, index) => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    questionWords.forEach(word => {
      if (chunkLower.includes(word)) score++;
    });
    return { chunk, score, index };
  });

  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(c => c.chunk);
};

const SYSTEM_PROMPT = `You are EduMentor, an advanced RAG-powered academic tutor. Your task is to provide high-quality, structured answers based on the provided DOCUMENT EXCERPTS.

When answering, ALWAYS follow this exact JSON structure:
{
  "explanation": "A synthesis of the answer based on the context (3-5 sentences). Be pedagogical and clear.",
  "sourceSnippet": "A specific, verbatim quote from the text that directly supports your answer.",
  "keyPoints": [
    "Core point 1 extracted from the text",
    "Core point 2 extracted from the text"
  ],
  "relevanceScore": 1-10 (How well the document context answered the question)
}

Rules:
- If the answer is absolutely not in the excerpts, say so, but provide a general educational answer while clearly distinguishing it from the document content.
- Support your explanation with the provided sourceSnippet.
- NEVER wrap the JSON in markdown code blocks. Output ONLY a raw JSON object.`;

const answerFromDocument = async (context, question, difficulty = "intermediate", conversationHistory = []) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // ─── PART OF MAISHA'S TASK: REG-based Retrieval ──────────────────────────
  const relevantChunks = getRelevantChunks(context, question);
  const consolidatedContext = relevantChunks.join("\n\n--- SECTION BREAK ---\n\n");

  const fullPrompt = `DOCUMENT EXCERPTS (RANKED BY RELEVANCE):
  """
  ${consolidatedContext}
  """
  
  [Target Difficulty: ${difficulty}]
  Question: ${question}`;

  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "Understood. I will analyze the provided snippets and provide a structured JSON response based on the document's facts." }] },
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
      sourceSnippet: "Analysis completed but JSON formatting failed.",
      keyPoints: [],
      relevanceScore: 5
    };
  }
};

module.exports = {
  extractTextFromBuffer,
  answerFromDocument,
};
