const Notification = require("./notification.model");
const RevisionSchedule = require("../Study/revision.model");

/**
 * Checks for due revisions and generates a batched notification if none exists for today.
 */
const checkAndGenerateReminders = async (userId) => {
  const now = new Date();
  
  // Find notes due for review
  const dueNotes = await RevisionSchedule.find({
    userId,
    nextReviewDate: { $lte: now },
  });

  if (dueNotes.length === 0) return null;

  // Check if we already sent a REVISION notification in the last 12 hours
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const existingNotification = await Notification.findOne({
    userId,
    type: "REVISION",
    createdAt: { $gte: twelveHoursAgo },
  });

  if (existingNotification) {
    // Update existing notification if count changed
    if (existingNotification.dueCount !== dueNotes.length) {
      existingNotification.message = `You have ${dueNotes.length} notes due for revision. Boost your retention now!`;
      existingNotification.dueCount = dueNotes.length;
      await existingNotification.save();
    }
    return existingNotification;
  }

  // Create new batched notification
  const notification = await Notification.create({
    userId,
    title: "Daily Revision Roadmap",
    message: `You have ${dueNotes.length} notes due for revision. Boost your retention now!`,
    type: "REVISION",
    link: "/study-modes",
    dueCount: dueNotes.length,
  });

  return notification;
};

/**
 * Gets all notifications for a user, triggering a fresh check for reminders first.
 */
const getNotifications = async (userId) => {
  await checkAndGenerateReminders(userId);
  return await Notification.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Marks a notification as read.
 */
const markAsRead = async (id) => {
  return await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
};

module.exports = {
  getNotifications,
  markAsRead,
};
