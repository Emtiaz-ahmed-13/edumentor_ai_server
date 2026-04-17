const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["REVISION", "SYSTEM", "GOAL"],
      default: "SYSTEM",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: "/study-modes",
    },
    dueCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
