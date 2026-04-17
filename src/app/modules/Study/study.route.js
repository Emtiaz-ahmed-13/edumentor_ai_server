const express = require("express");
const studyController = require("./study.controller");
const clerkAuth = require("../../middlewares/clerkAuth");

const router = express.Router();

router.post(
  "/session",
  clerkAuth,
  studyController.logSession
);

router.post(
  "/update-schedule",
  clerkAuth,
  studyController.updateSchedule
);

router.get(
  "/due",
  clerkAuth,
  studyController.getDueNotes
);

module.exports = router;
