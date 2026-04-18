const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema(
  {
    durationMinutes: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    sessionDateString: {
      type: String, // e.g., 'YYYY-MM-DD' for easier grouping
    },
    status: {
      type: String,
      enum: ["Active", "Completed"],
      default: "Active",
    },
    topics: {
      type: [String],
      default: ["General"],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to populate sessionDateString
studySessionSchema.pre("save", function (next) {
  if (this.date && !this.sessionDateString) {
    this.sessionDateString = this.date.toISOString().split("T")[0];
  }
  next();
});

const StudySession = mongoose.model("StudySession", studySessionSchema);

module.exports = StudySession;
