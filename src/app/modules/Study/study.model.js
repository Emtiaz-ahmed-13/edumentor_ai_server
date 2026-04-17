const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: false,
    },
    type: {
      type: String,
      enum: ["focus", "recall", "revision"],
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const StudySession = mongoose.model("StudySession", studySessionSchema);

module.exports = StudySession;
