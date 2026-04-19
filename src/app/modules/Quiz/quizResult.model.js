const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, default: "guest" },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: false },
    subject: { type: String, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    accuracy: { type: Number, required: true }, // percentage
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"] },
    topics: [{ type: String }],
    userAnswers: { type: Object, default: {} },
    evaluations: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizResult", quizResultSchema);
