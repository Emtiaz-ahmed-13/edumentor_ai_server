const express = require("express");
const aiController = require("./ai.controller");

const router = express.Router();

router.post("/ask", aiController.askQuestion);
router.post("/analyze-code", aiController.analyzeCode);

module.exports = router;
