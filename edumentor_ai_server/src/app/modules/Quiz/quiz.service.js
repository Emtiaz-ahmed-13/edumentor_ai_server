const { GoogleGenerativeAI } = require("@google/generative-ai");

// Only gemini-2.5-flash — highest free tier limit (10 RPM, 250K TPM)
const MODEL = "gemini-2.5-flash";

// ─── Retry helper: handles 503 overloaded with exponential backoff ────────────
const callWithRetry = async (model, contents, retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent({ contents });
      return result;
    } catch (err) {
      const is503 = err?.status === 503 || err?.message?.includes("503");
      const is429 = err?.status === 429 || err?.message?.includes("429");
      if (is503 && i < retries - 1) {
        const wait = (i + 1) * 8000; // 8s, 16s, 24s, 32s
        console.log(`Model overloaded (503), retrying in ${wait / 1000}s... (attempt ${i + 2}/${retries})`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (is429) {
        // Quota exceeded — no point retrying, throw immediately
        throw new Error("API quota exceeded. Please wait a few minutes and try again.");
      }
      throw err;
    }
  }
  throw new Error("Model is currently overloaded. Please try again in a moment.");
};

// ─── Safe JSON parse ──────────────────────────────────────────────────────────
const safeParseJSON = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
};

// ─── Feature 9: Generate Quiz ─────────────────────────────────────────────────
const generateQuiz = async (topic, difficulty, numQuestions, sourceType, material) => {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const mcqCount = Math.round(numQuestions * 0.5);
  const tfCount = Math.round(numQuestions * 0.25);
  const saCount = numQuestions - mcqCount - tfCount;

  const source = sourceType === "material"
    ? `Based on this study material:\n\n${material.slice(0, 4000)}`
    : `Topic: "${topic}"`;

  const prompt = `Generate a JSON quiz. ${source}

Difficulty: ${difficulty}
Questions needed: ${mcqCount} MCQ, ${tfCount} True/False, ${saCount} Short-Answer

Return ONLY this JSON (no markdown):
{
  "title": "Quiz title",
  "subject": "Subject name",
  "questions": [
    {"type":"mcq","question":"?","options":["A) ...","B) ...","C) ...","D) ..."],"correctAnswer":"A) ...","explanation":"...","points":10},
    {"type":"true-false","question":"statement","options":["True","False"],"correctAnswer":"True","explanation":"...","points":5},
    {"type":"short-answer","question":"?","options":[],"correctAnswer":"model answer","explanation":"...","points":15}
  ]
}`;

  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const result = await callWithRetry(model, contents);
  const text = result.response.text();

  let parsed;
  try {
    parsed = safeParseJSON(text);
  } catch {
    throw new Error("Failed to parse quiz response as JSON.");
  }

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("AI returned quiz with no questions.");
  }

  const totalPoints = parsed.questions.reduce((sum, q) => sum + (q.points || 10), 0);

  return {
    title: parsed.title || `Quiz on ${topic}`,
    subject: parsed.subject || "General",
    questions: parsed.questions,
    totalQuestions: parsed.questions.length,
    totalPoints,
  };
};

// ─── Feature 10: Evaluate Answer ─────────────────────────────────────────────
const evaluateAnswer = async (question, correctAnswer, userAnswer, maxPoints) => {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const max = maxPoints || 10;

  const prompt = `Evaluate this student answer and return ONLY JSON (no markdown):

Question: ${question}
Correct Answer: ${correctAnswer}
Student Answer: ${userAnswer || "(blank)"}
Max Points: ${max}

{
  "score": <number 0-${max}>,
  "maxScore": ${max},
  "percentage": <0-100>,
  "grade": <"A"|"B"|"C"|"D"|"F">,
  "overallFeedback": "2-3 sentences",
  "strengths": ["strength1"],
  "improvements": ["improvement1"],
  "suggestedAnswer": "ideal answer",
  "keyMissingPoints": ["missing point"]
}

Grading: A=90-100, B=80-89, C=70-79, D=60-69, F=below 60.`;

  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const result = await callWithRetry(model, contents);
  const text = result.response.text();

  let parsed;
  try {
    parsed = safeParseJSON(text);
  } catch {
    throw new Error("Failed to parse evaluation response as JSON.");
  }

  return {
    score: parsed.score ?? 0,
    maxScore: parsed.maxScore ?? max,
    percentage: parsed.percentage ?? 0,
    grade: parsed.grade ?? "F",
    overallFeedback: parsed.overallFeedback ?? "",
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    suggestedAnswer: parsed.suggestedAnswer ?? correctAnswer,
    keyMissingPoints: Array.isArray(parsed.keyMissingPoints) ? parsed.keyMissingPoints : [],
  };
};

module.exports = { generateQuiz, evaluateAnswer };
