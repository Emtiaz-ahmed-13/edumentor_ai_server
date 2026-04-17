const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    wrongAnswers: [
      {
        question: String,
        userAnswer: String,
        correctAnswer: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const QuizResult = mongoose.model("QuizResult", quizResultSchema);

module.exports = QuizResult;
