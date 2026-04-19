const express = require("express");
const notificationController = require("./notification.controller");

const router = express.Router();

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);

module.exports = router;
