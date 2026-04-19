const Notification = require("./notification.model");
const sendResponse = require("../../utils/sendResponse");

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.auth?.userId || "guest";
    
    // Seed initial notifications if empty (for demonstration)
    const count = await Notification.countDocuments({ userId });
    if (count === 0) {
      await Notification.create([
        {
          userId,
          title: "Welcome to EduMentor AI!",
          message: "Check out the new AI Quiz Generator and Skill Gap analysis.",
          type: "success",
        },
        {
          userId,
          title: "Setup your goals",
          message: "Track your academic journey by setting daily study goals.",
          type: "info",
        }
      ]);
    }

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};
