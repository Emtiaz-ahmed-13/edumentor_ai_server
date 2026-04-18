const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["daily", "weekly"],
      required: true,
    },
    targetDuration: {
      type: Number,
      required: true,
    },
    progressDuration: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started",
    },
  },
  {
    timestamps: true,
  }
);

goalSchema.pre("save", function(next) {
  if (this.progressDuration === 0) {
    this.status = "Not Started";
  } else if (this.progressDuration >= this.targetDuration) {
    this.status = "Completed";
  } else {
    this.status = "In Progress";
  }
  next();
});

const Goal = mongoose.model("Goal", goalSchema);

module.exports = Goal;
