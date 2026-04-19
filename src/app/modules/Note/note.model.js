const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: Object,
      required: true,
    },
    fileUrl: {
      type: String,
      required: false,
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    // Spaced Repetition Fields
    nextReviewDate: {
      type: Date,
      default: Date.now,
    },
    repetitionInterval: {
      type: Number,
      default: 0, // in days
    },
    easeFactor: {
      type: Number,
      default: 2.5,
    },
  },
  {
    timestamps: true,
  }
);

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
