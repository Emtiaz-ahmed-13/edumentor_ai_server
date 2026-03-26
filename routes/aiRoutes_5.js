const express = require("express");
const { handleVoiceChat_5 } = require("../controllers/aiController_5");
const router = express.Router();

router.post("/chat", handleVoiceChat_5);

module.exports = router;
