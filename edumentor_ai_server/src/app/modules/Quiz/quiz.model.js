const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["mcq", "true-false", "short-answer"],
    required: true,
  },
  question: { type: String, required: true },
  options: { type: [String], default: [] },
  correctAnswer: { type: String, required: true },
  explanation: { type: String, default: "" },
  points: { type: Number, default: 10 },
});

const quizSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "guest" },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    subject: { type: String, default: "General" },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },
    sourceType: {
      type: String,
      enum: ["topic", "material"],
      default: "topic",
    },
    questions: [questionSchema],
    totalQuestions: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);
module.exports = Quiz;
