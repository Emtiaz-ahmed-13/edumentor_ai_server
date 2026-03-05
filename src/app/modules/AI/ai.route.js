const express = require("express");
const aiController = require("./ai.controller");

const router = express.Router();

router.post("/ask", aiController.askQuestion);

module.exports = router;
