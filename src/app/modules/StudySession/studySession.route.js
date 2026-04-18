const express = require("express");
const controller = require("./studySession.controller");

const router = express.Router();

router.get("/current", controller.getCurrentSession);
router.patch("/:id", controller.updateSession);
router.get("/history", controller.getHistory);
router.get("/analytics", controller.getAnalyticsSummary);

module.exports = router;
