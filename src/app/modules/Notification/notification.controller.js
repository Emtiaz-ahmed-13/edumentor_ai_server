const notificationService = require("./notification.service");

const getNotifications = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const notifications = await notificationService.getNotifications(userId);
    res.status(200).send({
      success: true,
      message: "Notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to fetch notifications",
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id);
    res.status(200).send({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to update notification",
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};
