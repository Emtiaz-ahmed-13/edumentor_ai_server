const express = require("express");
const controller = require("./goal.controller");

const router = express.Router();

router.post("/", controller.createGoal);
router.get("/", controller.getGoals);
router.patch("/progress", controller.updateProgress);
router.get("/productivity-score", controller.getProductivityScore);

module.exports = router;
