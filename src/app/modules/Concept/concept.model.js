const mongoose = require("mongoose");

const conceptSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      default: "General",
    },
    difficultyLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    explanation: {
      type: String,
      required: true,
    },
    steps: {
      type: [String],
      default: [],
    },
    realLifeExample: {
      type: String,
      default: "",
    },
    analogy: {
      type: String,
      default: "",
    },
    keyPoints: {
      type: [String],
      default: [],
    },
    funFact: {
      type: String,
      default: "",
    },
    commonMisconception: {
      type: String,
      default: "",
    },
    followUpQuestions: {
      type: [String],
      default: [],
    },
    userNote: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Concept = mongoose.model("Concept", conceptSchema);

module.exports = Concept;
