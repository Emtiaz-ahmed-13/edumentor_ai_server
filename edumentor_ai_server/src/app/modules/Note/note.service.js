const pdfParse = require("pdf-parse-new");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const WORDS_PER_CHUNK = 500;
const MAX_CHUNKS = 10;
const MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
];
const getModel = (modelName = MODELS[0]) => {
  if (!process.env.GEMINI_API_KEY)
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: modelName });
};
const safeParseJSON = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  return JSON.parse(text);
};

const chunkByWords = (text, wordsPerChunk = WORDS_PER_CHUNK) => {
  const words = text.trim().split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length && chunks.length < MAX_CHUNKS; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }

  return chunks;
};

// ─── Extract text from PDF buffer ────────────────────────────────────────────
const extractTextFromBuffer = async (buffer) => {
  try {
    if (!buffer || buffer.length === 0) throw new Error("Invalid PDF buffer.");
    const data = await pdfParse(buffer);
    if (!data.text || data.text.trim().length === 0)
      throw new Error("PDF contains no extractable text.");
    return { text: data.text, pageCount: data.numpages || 0 };
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    throw new Error("Failed to extract text from PDF.");
  }
};

// ─── Prompts ──────────────────────────────────────────────────────────────────
const CHUNK_PROMPT = `You are EduMentor, an expert academic content analyser.
Analyse the following 500-word excerpt from a student's PDF notes.
Return ONLY valid JSON — no markdown, no extra text.

{
  "mainIdeas": ["Key idea 1", "Key idea 2", "Key idea 3"],
  "keyTerms": ["Term 1", "Term 2", "Term 3"],
  "importantFacts": ["Fact 1", "Fact 2"]
}`;

const FINAL_PROMPT = `You are EduMentor Note Summarizer, an expert academic assistant.
You have received chunk-level summaries from a student's PDF notes (each chunk = 500 words).
Consolidate them into ONE comprehensive structured academic summary.

Return ONLY valid JSON — no markdown, no extra text:
{
  "title": "Concise descriptive title for the entire document",
  "subject": "Detected academic subject (e.g., Computer Science, Mathematics, Biology)",
  "overview": "3–5 sentence overview of what the document covers.",
  "mainTopics": [
    { "topic": "Topic Name", "explanation": "3–5 sentence explanation of this topic." }
  ],
  "keyTakeaways": [
    "Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5"
  ],
  "definitions": [
    { "term": "Term", "definition": "Clear concise definition." }
  ],
  "examQuestions": {
    "mcq": [
      {
        "question": "MCQ question?",
        "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
        "answer": "C) ...",
        "explanation": "Why this is correct."
      }
    ],
    "shortAnswer": [
      { "question": "Short answer question?", "modelAnswer": "Model answer." }
    ]
  },
  "studyTips": ["Tip 1", "Tip 2", "Tip 3"]
}

Rules:
- Exactly 5 MCQs and 3 short-answer questions.
- At least 5 definitions.
- 3–10 mainTopics covering all major sections.
- Exactly 5 keyTakeaways.
- NEVER output markdown fences. Raw JSON only.`;

const DOC_QA_PROMPT = `You are EduMentor, an expert academic tutor.
A student has uploaded their study notes and has a question about the content.
Answer ONLY based on the provided document content.

Return ONLY valid JSON — no markdown, no extra text:
{
  "answer": "Detailed accurate answer based on the document.",
  "relevantSection": "Direct quote or reference from the document.",
  "confidence": "high | medium | low",
  "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
}`;

const summariseChunk = async (model, chunk, index) => {
  try {
    const prompt = `${CHUNK_PROMPT}\n\n--- CHUNK ${index + 1} (500 words) ---\n${chunk}`;
    const result = await model.generateContent(prompt);
    return safeParseJSON(result.response.text());
  } catch (err) {
    console.warn(`Chunk ${index + 1} failed:`, err.message);
    return { mainIdeas: [], keyTerms: [], importantFacts: [] };
  }
};

const consolidateSummaries = async (model, chunkSummaries) => {
  const combined = chunkSummaries
    .map(
      (s, i) =>
        `Chunk ${i + 1}:\n- Main Ideas: ${s.mainIdeas?.join("; ") || "N/A"}\n- Key Terms: ${s.keyTerms?.join(", ") || "N/A"}\n- Facts: ${s.importantFacts?.join("; ") || "N/A"}`
    )
    .join("\n\n");

  const prompt = `${FINAL_PROMPT}\n\n--- CHUNK SUMMARIES (each chunk = 500 words) ---\n${combined}`;
  const result = await model.generateContent(prompt);
  return safeParseJSON(result.response.text());
};

const generateSummary = async (text) => {
  let lastError;

  for (const modelName of MODELS) {
    try {
      const model = getModel(modelName);
      const chunks = chunkByWords(text);

      console.log(
        `📄 [${modelName}] Processing ${chunks.length} chunks × 500 words each...`
      );

      // Step 1: Process each chunk independently
      const chunkSummaries = await Promise.all(
        chunks.map((chunk, i) => summariseChunk(model, chunk, i))
      );

      console.log(`🔗 Consolidating ${chunkSummaries.length} chunk summaries...`);

      // Step 2: Consolidate into final summary
      const finalSummary = await consolidateSummaries(model, chunkSummaries);

      console.log(`✅ Summary complete with ${modelName}.`);
      return finalSummary;
    } catch (err) {
      console.warn(`${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All models failed to generate summary.");
};

// ─── Document-Based Q&A ───────────────────────────────────────────────────────
const generateAnswerFromNote = async (noteContent, question) => {
  try {
    const model = getModel();

    // Use first 2 chunks (1000 words) as context for Q&A
    const chunks = chunkByWords(noteContent);
    const context = chunks.slice(0, 2).join("\n\n");

    const prompt = `${DOC_QA_PROMPT}\n\n--- DOCUMENT CONTENT ---\n${context}\n\n--- STUDENT QUESTION ---\n${question}`;
    const result = await model.generateContent(prompt);
    return safeParseJSON(result.response.text());
  } catch (error) {
    console.error("Document Q&A Error:", error);
    throw new Error("Failed to generate answer from document.");
  }
};

module.exports = {
  extractTextFromBuffer,
  generateSummary,
  generateAnswerFromNote,
  chunkByWords,
};
