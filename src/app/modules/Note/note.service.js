const pdfParse = require("pdf-parse-new");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const CHUNK_SIZE = 6000;   
const MAX_CHUNKS = 8;      
const MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro", "gemini-pro"];

// ─── Helper: Gemini model factory ────────────────────────────────────────────
const getModel = (modelName = MODELS[0]) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: modelName });
};

// ─── Helper: safe JSON parse from AI response ─────────────────────────────────
const safeParseJSON = (text) => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return JSON.parse(text);
};
const CHUNK_SUMMARY_PROMPT = `You are EduMentor, an expert academic content analyser.
Analyse the following excerpt from a student's PDF notes and return a brief JSON summary.
Return ONLY valid JSON with no extra text or markdown.

JSON format:
{
  "mainIdeas": ["Key idea 1", "Key idea 2", "Key idea 3"],
  "keyTerms": ["Term 1", "Term 2"],
  "importantFacts": ["Fact 1", "Fact 2"]
}`;

const FINAL_SUMMARY_PROMPT = `You are EduMentor Note Summarizer, an expert academic assistant.
You have received partial summaries of each section of a student's PDF notes.
Consolidate them into ONE comprehensive, structured academic summary.

Return ONLY valid JSON — no markdown, no extra text:
{
  "title": "A concise, descriptive title for the entire document",
  "subject": "The detected academic subject (e.g., Computer Science, Mathematics, Biology)",
  "overview": "A 3–5 sentence overview of what the document covers and its main purpose.",
  "mainTopics": [
    {
      "topic": "Topic Name",
      "explanation": "Detailed explanation of this topic from the notes (3–5 sentences)."
    }
  ],
  "keyTakeaways": [
    "Takeaway 1 — most important lesson from the document.",
    "Takeaway 2",
    "Takeaway 3",
    "Takeaway 4",
    "Takeaway 5"
  ],
  "definitions": [
    { "term": "Term Name", "definition": "Clear, concise definition as used in the document." }
  ],
  "examQuestions": {
    "mcq": [
      {
        "question": "MCQ question text?",
        "options": ["A) Option A", "B) Option B", "C) Option C", "D) Option D"],
        "answer": "C) Option C",
        "explanation": "Brief explanation of why this is correct."
      }
    ],
    "shortAnswer": [
      {
        "question": "Short answer question text?",
        "modelAnswer": "A model answer a student should aim to provide."
      }
    ]
  },
  "studyTips": [
    "Specific study tip based on the content of these notes.",
    "Another targeted tip.",
    "A third tip."
  ]
}

Rules:
- Generate exactly 5 MCQ questions and 3 short-answer questions in examQuestions.
- Generate at least 5 definitions for key terms found in the notes.
- mainTopics must cover all major sections — minimum 3 topics, maximum 10.
- keyTakeaways must have exactly 5 entries.
- NEVER output markdown code fences. Output ONLY a raw JSON object.`;

// ─── Prompt: document-based Q&A ──────────────────────────────────────────────
const DOC_QA_PROMPT = `You are EduMentor, an expert academic tutor. A student has uploaded their study notes and has a question about the content.
Answer ONLY based on the provided document content. If the answer is not in the document, say so clearly.

Return ONLY valid JSON — no markdown, no extra text:
{
  "answer": "A detailed, accurate answer based on the document content.",
  "relevantSection": "A direct quote or reference from the document that supports your answer.",
  "confidence": "high | medium | low — how confident you are the document contains the answer.",
  "followUpQuestions": ["A follow-up question the student might have.", "Another related question."]
}`;

// ─── Split text into chunks ────────────────────────────────────────────────────
const chunkText = (text, chunkSize = CHUNK_SIZE) => {
  const chunks = [];
  let start = 0;
  while (start < text.length && chunks.length < MAX_CHUNKS) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize;
  }
  return chunks;
};

// ─── Extract text from PDF buffer ─────────────────────────────────────────────
const extractTextFromBuffer = async (buffer) => {
  try {
    if (!buffer || buffer.length === 0) {
      throw new Error("Invalid PDF buffer.");
    }
    const data = await pdfParse(buffer);
    if (!data.text || data.text.trim().length === 0) {
      throw new Error("PDF contains no extractable text.");
    }
    return { text: data.text, pageCount: data.numpages || 0 };
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    throw new Error("Failed to extract text from PDF.");
  }
};

// ─── Summarise one chunk ──────────────────────────────────────────────────────
const summariseChunk = async (model, chunk, index) => {
  try {
    const prompt = `${CHUNK_SUMMARY_PROMPT}\n\n--- EXCERPT (Section ${index + 1}) ---\n${chunk}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return safeParseJSON(text);
  } catch (err) {
    console.warn(`Chunk ${index + 1} summarisation failed:`, err.message);
    return { mainIdeas: [], keyTerms: [], importantFacts: [] };
  }
};

// ─── Final consolidation from chunk summaries ─────────────────────────────────
const consolidateSummaries = async (model, chunkSummaries, originalTitle) => {
  const combinedText = chunkSummaries
    .map((s, i) => `Section ${i + 1}:\n- Main Ideas: ${s.mainIdeas?.join("; ")}\n- Key Terms: ${s.keyTerms?.join(", ")}\n- Facts: ${s.importantFacts?.join("; ")}`)
    .join("\n\n");

  const prompt = `${FINAL_SUMMARY_PROMPT}\n\n--- SECTION SUMMARIES ---\n${combinedText}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return safeParseJSON(text);
};

// ─── Main: generate full summary (RAG-style chunking) ─────────────────────────
const generateSummary = async (text) => {
  try {
    let lastError;
    for (const modelName of MODELS) {
      try {
        const model = getModel(modelName);
        const chunks = chunkText(text);
        console.log(`📄 Attempting summary with ${modelName} (${chunks.length} chunks)...`);

        const chunkSummaries = await Promise.all(
          chunks.map((chunk, i) => summariseChunk(model, chunk, i))
        );

        const finalSummary = await consolidateSummaries(model, chunkSummaries, "Note");
        console.log(`✅ Final summary generated successfully with ${modelName}.`);
        return finalSummary;
      } catch (err) {
        console.warn(`${modelName} failed:`, err.message);
        lastError = err;
      }
    }
    throw lastError || new Error("All models failed to generate summary.");
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    throw new Error("Failed to generate summary from PDF.");
  }
};

// ─── Document-Based Q&A ───────────────────────────────────────────────────────
const generateAnswerFromNote = async (noteContent, question) => {
  try {
    const model = getModel();

    // Use the most relevant chunk if content is long
    const relevantContent = noteContent.length > CHUNK_SIZE * 2
      ? noteContent.slice(0, CHUNK_SIZE * 2)
      : noteContent;

    const prompt = `${DOC_QA_PROMPT}\n\n--- DOCUMENT CONTENT ---\n${relevantContent}\n\n--- STUDENT QUESTION ---\n${question}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return safeParseJSON(text);
  } catch (error) {
    console.error("Document Q&A Error:", error);
    throw new Error("Failed to generate answer from document.");
  }
};

module.exports = {
  extractTextFromBuffer,
  generateSummary,
  generateAnswerFromNote,
};
