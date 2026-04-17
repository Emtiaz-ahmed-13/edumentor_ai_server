const express = require("express");
const quizController = require("./quiz.controller");
const clerkAuth = require("../../middlewares/clerkAuth");

const router = express.Router();

router.post(
  "/submit",
  clerkAuth,
  quizController.submitQuiz
);

router.get(
  "/weak-topics",
  clerkAuth,
  quizController.getWeakTopics
);

module.exports = router;
