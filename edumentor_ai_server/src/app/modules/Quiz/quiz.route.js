const express = require("express");
const multer = require("multer");
const router = express.Router();
const quizController = require("./quiz.controller");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  },
});

// Feature 9: Generate quiz from topic or pasted material
router.post("/generate", quizController.generateQuiz);

// Feature 9: Generate quiz from uploaded PDF file
router.post("/generate-from-pdf", upload.single("pdf"), quizController.generateFromPdf);

// Feature 10: Evaluate a descriptive answer
router.post("/evaluate-answer", quizController.evaluateAnswer);

// Quiz history
router.get("/history", quizController.getQuizHistory);

// Get single quiz
router.get("/:id", quizController.getQuizById);

// Delete quiz
router.delete("/:id", quizController.deleteQuiz);

module.exports = router;
