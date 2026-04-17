const mongoose = require("mongoose");

const revisionScheduleSchema = new mongoose.Schema(
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
    nextReviewDate: {
      type: Date,
      required: true,
    },
    interval: {
      type: Number, // in days
      default: 1,
    },
    repetition: {
      type: Number,
      default: 0,
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

// Compound index to ensure one schedule per note per user
revisionScheduleSchema.index({ userId: 1, noteId: 1 }, { unique: true });

const RevisionSchedule = mongoose.model("RevisionSchedule", revisionScheduleSchema);

module.exports = RevisionSchedule;
