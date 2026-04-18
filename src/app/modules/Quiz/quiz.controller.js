const pdfParse = require("pdf-parse-new");
const sendResponse = require("../../utils/sendResponse");
const quizService = require("./quiz.service");
const Quiz = require("./quiz.model");
const QuizResult = require("./quizResult.model");

// Feature 9: Generate quiz from topic or pasted material
const generateQuiz = async (req, res, next) => {
  try {
    const { topic, difficulty = "intermediate", numQuestions = 10, sourceType = "topic", material } = req.body;

    if (sourceType === "topic" && !topic)
      return res.status(400).json({ success: false, message: "Topic is required." });
    if (sourceType === "material" && !material)
      return res.status(400).json({ success: false, message: "Material text is required." });

    const count = Math.min(Math.max(parseInt(numQuestions) || 10, 3), 20);
    const result = await quizService.generateQuiz(topic || "General Knowledge", difficulty, count, sourceType, material);

    let savedQuiz;
    try {
      savedQuiz = await Quiz.create({
        userId: req.auth?.userId || "guest",
        title: result.title,
        topic: topic || "Material-Based Quiz",
        subject: result.subject,
        difficulty,
        sourceType,
        questions: result.questions,
        totalQuestions: result.totalQuestions,
        totalPoints: result.totalPoints,
      });
    } catch (dbErr) {
      console.error("Warning: Failed to save quiz:", dbErr.message);
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Quiz generated successfully!",
      data: { ...result, _id: savedQuiz?._id, createdAt: savedQuiz?.createdAt || new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
};

// Feature 9: Generate quiz from uploaded PDF
const generateFromPdf = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "PDF file is required." });

    const { difficulty = "intermediate", numQuestions = 10 } = req.body;

    let extractedText;
    try {
      const data = await pdfParse(req.file.buffer);
      extractedText = data.text;
      if (!extractedText?.trim()) return res.status(400).json({ success: false, message: "PDF contains no extractable text." });
    } catch {
      return res.status(400).json({ success: false, message: "Failed to read PDF file." });
    }

    const count = Math.min(Math.max(parseInt(numQuestions) || 10, 3), 20);
    const fileName = req.file.originalname.replace(".pdf", "");
    const result = await quizService.generateQuiz(fileName, difficulty, count, "material", extractedText);

    let savedQuiz;
    try {
      savedQuiz = await Quiz.create({
        userId: req.auth?.userId || "guest",
        title: result.title,
        topic: fileName,
        subject: result.subject,
        difficulty,
        sourceType: "material",
        questions: result.questions,
        totalQuestions: result.totalQuestions,
        totalPoints: result.totalPoints,
      });
    } catch (dbErr) {
      console.error("Warning: Failed to save quiz:", dbErr.message);
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Quiz generated from PDF successfully!",
      data: { ...result, _id: savedQuiz?._id, createdAt: savedQuiz?.createdAt || new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
};

// Feature 10: Evaluate descriptive answer
const evaluateAnswer = async (req, res, next) => {
  try {
    const { question, correctAnswer, userAnswer, maxPoints } = req.body;

    if (!question)
      return res.status(400).json({ success: false, message: "Question is required." });
    if (!userAnswer?.trim())
      return res.status(400).json({ success: false, message: "userAnswer is required." });

    const evaluation = await quizService.evaluateAnswer(question, correctAnswer, userAnswer, maxPoints);
    sendResponse(res, { statusCode: 200, success: true, message: "Answer evaluated successfully!", data: evaluation });
  } catch (error) {
    next(error);
  }
};

const getQuizHistory = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find()
      .select("title topic subject difficulty sourceType totalQuestions totalPoints createdAt")
      .sort({ createdAt: -1 })
      .limit(20);
    sendResponse(res, { statusCode: 200, success: true, message: "Quiz history fetched.", data: quizzes });
  } catch (error) { next(error); }
};

const getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found." });
    sendResponse(res, { statusCode: 200, success: true, message: "Quiz fetched.", data: quiz });
  } catch (error) { next(error); }
};

const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found." });
    sendResponse(res, { statusCode: 200, success: true, message: "Quiz deleted.", data: null });
  } catch (error) { next(error); }
};

// Feature 11 & 15: Submit quiz result and track analytics
const submitQuizResult = async (req, res, next) => {
  try {
    const { quizId, subject, score, totalQuestions, difficulty, topics } = req.body;
    
    const accuracy = (score / totalQuestions) * 100;
    
    const result = await QuizResult.create({
      userId: req.auth?.userId || "guest",
      quizId,
      subject: subject || "General",
      score,
      totalQuestions,
      accuracy,
      difficulty,
      topics
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Result submitted successfully!",
      data: result,
    });
  } catch (error) { next(error); }
};

// Feature 11: Detect weak topics
const getWeakTopics = async (req, res, next) => {
  try {
    const results = await QuizResult.find({ userId: req.auth?.userId || "guest" });

    if (results.length === 0) {
      return sendResponse(res, {
        statusCode: 200,
        success: true,
        data: {
          totalQuizzes: 0,
          weakTopics: [],
          performanceData: [],
        },
      });
    }

    // Aggregate accuracy by subject
    const subjectStats = {};
    results.forEach(r => {
      if (!subjectStats[r.subject]) {
        subjectStats[r.subject] = { totalAccuracy: 0, count: 0 };
      }
      subjectStats[r.subject].totalAccuracy += r.accuracy;
      subjectStats[r.subject].count += 1;
    });

    const performanceData = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      accuracy: Math.round(stats.totalAccuracy / stats.count),
    }));

    // Weak topics are those with < 70% accuracy
    const weakTopics = performanceData.filter(p => p.accuracy < 70);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: {
        totalQuizzes: results.length,
        weakTopics,
        performanceData,
      },
    });
  } catch (error) { next(error); }
};

module.exports = { 
  generateQuiz, 
  generateFromPdf, 
  evaluateAnswer, 
  getQuizHistory, 
  getQuizById, 
  deleteQuiz,
  submitQuizResult,
  getWeakTopics
};
