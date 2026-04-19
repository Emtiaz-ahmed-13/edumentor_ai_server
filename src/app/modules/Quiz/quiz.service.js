const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODEL = "gemini-2.5-flash";

const callWithRetry = async (model, contents, retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent({ contents });
    } catch (err) {
      const is503 = err?.status === 503 || err?.message?.includes("503");
      const is429 = err?.status === 429 || err?.message?.includes("429");
      if (is503 && i < retries - 1) {
        const wait = (i + 1) * 8000;
        console.log(`Model overloaded, retrying in ${wait / 1000}s... (${i + 2}/${retries})`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (is429) throw new Error("API quota exceeded. Please wait a few minutes and try again.");
      throw err;
    }
  }
  throw new Error("Model is currently overloaded. Please try again.");
};

const safeParseJSON = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
};

// Feature 9: Generate Quiz from topic or material
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

  const result = await callWithRetry(model, [{ role: "user", parts: [{ text: prompt }] }]);
  const parsed = safeParseJSON(result.response.text());

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0)
    throw new Error("AI returned quiz with no questions.");

  return {
    title: parsed.title || `Quiz on ${topic}`,
    subject: parsed.subject || "General",
    questions: parsed.questions,
    totalQuestions: parsed.questions.length,
    totalPoints: parsed.questions.reduce((sum, q) => sum + (q.points || 10), 0),
  };
};

// Feature 10: Evaluate Answer
const evaluateAnswer = async (question, correctAnswer, userAnswer, maxPoints) => {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL });
  const max = maxPoints || 10;

  const refAnswer = correctAnswer ? `Correct Answer: ${correctAnswer}\n` : "";
  const prompt = `Evaluate this student answer and return ONLY JSON (no markdown):

Question: ${question}
${refAnswer}Student Answer: ${userAnswer || "(blank)"}
Max Points: ${max}

{
  "score": <0-${max}>,
  "maxScore": ${max},
  "percentage": <0-100>,
  "grade": <"A"|"B"|"C"|"D"|"F">,
  "overallFeedback": "2-3 sentences",
  "strengths": ["..."],
  "improvements": ["..."],
  "suggestedAnswer": "ideal answer",
  "keyMissingPoints": ["..."]
}

Grading: A=90-100, B=80-89, C=70-79, D=60-69, F=below 60.`;

  const result = await callWithRetry(model, [{ role: "user", parts: [{ text: prompt }] }]);
  const parsed = safeParseJSON(result.response.text());

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

const generateQuizFromPDFBuffer = async (buffer, difficulty, numQuestions, fileName) => {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const mcqCount = Math.round(numQuestions * 0.5);
  const tfCount = Math.round(numQuestions * 0.25);
  const saCount = numQuestions - mcqCount - tfCount;

  const prompt = `You are EduMentor AI. I have uploaded a PDF titled "${fileName}".
Based ONLY on the content of this document, generate a JSON quiz.

Difficulty: ${difficulty}
Questions needed: ${mcqCount} MCQ, ${tfCount} True/False, ${saCount} Short-Answer

Return ONLY this JSON (no markdown):
{
  "title": "${fileName} Quiz",
  "subject": "Detected academic subject",
  "questions": [
    {"type":"mcq","question":"?","options":["A) ...","B) ...","C) ...","D) ..."],"correctAnswer":"A) ...","explanation":"...","points":10},
    {"type":"true-false","question":"statement","options":["True","False"],"correctAnswer":"True","explanation":"...","points":5},
    {"type":"short-answer","question":"?","options":[],"correctAnswer":"model answer","explanation":"...","points":15}
  ]
}`;

  const result = await callWithRetry(model, [
    {
      role: "user",
      parts: [
        { text: prompt },
        {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: "application/pdf"
          }
        }
      ]
    }
  ]);

  const parsed = safeParseJSON(result.response.text());

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0)
    throw new Error("AI returned quiz with no questions.");

  return {
    title: parsed.title || `${fileName} Quiz`,
    subject: parsed.subject || "General",
    questions: parsed.questions,
    totalQuestions: parsed.questions.length,
    totalPoints: parsed.questions.reduce((sum, q) => sum + (q.points || 10), 0),
  };
};

module.exports = { generateQuiz, evaluateAnswer, generateQuizFromPDFBuffer };
