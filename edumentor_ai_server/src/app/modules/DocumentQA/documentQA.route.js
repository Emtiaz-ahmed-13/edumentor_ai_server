const express = require("express");
const multer = require("multer");
const documentQAController = require("./documentQA.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), documentQAController.uploadDocument);
router.post("/ask", documentQAController.askQuestion);

module.exports = router;
