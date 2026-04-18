const express = require("express");
const multer = require("multer");
const router = express.Router();
const quizController = require("./quiz.controller");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed!"), false);
  },
});

router.post("/generate", quizController.generateQuiz);
router.post("/generate-from-pdf", upload.single("pdf"), quizController.generateFromPdf);
router.post("/evaluate-answer", quizController.evaluateAnswer);
router.get("/history", quizController.getQuizHistory);
router.get("/:id", quizController.getQuizById);
router.delete("/:id", quizController.deleteQuiz);

module.exports = router;
