const mongoose = require("mongoose");

/**
 * Concept Model - Stores AI-generated concept simplifications
 * Student: Syed Muntazir Mehdi (ID: 22299525)
 * Feature 4 - EduMentor AI
 */

const conceptSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

const Concept = mongoose.model("Concept", conceptSchema);

module.exports = Concept;
