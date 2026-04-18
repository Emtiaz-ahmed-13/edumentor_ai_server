const express = require("express");
const multer = require("multer");
const aiController = require("./ai.controller");
const quizController = require("../Quiz/quiz.controller");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed!"), false);
  },
});

// Existing AI routes
router.post("/ask", aiController.askQuestion);
router.post("/analyze-code", aiController.analyzeCode);

// Feature 9: Quiz generation (aliased under /ai for client compatibility)
router.post("/generate-quiz", quizController.generateQuiz);
router.post("/generate-quiz-pdf", upload.single("pdf"), quizController.generateFromPdf);

// Feature 10: Answer evaluation (aliased under /ai for client compatibility)
router.post("/evaluate-answer", quizController.evaluateAnswer);

module.exports = router;
