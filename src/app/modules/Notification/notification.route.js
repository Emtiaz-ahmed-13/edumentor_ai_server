const express = require("express");
const notificationController = require("./notification.controller");
const clerkAuth = require("../../middlewares/clerkAuth");

const router = express.Router();

router.get(
  "/",
  clerkAuth,
  notificationController.getNotifications
);

router.patch(
  "/:id/read",
  clerkAuth,
  notificationController.markAsRead
);

module.exports = router;
