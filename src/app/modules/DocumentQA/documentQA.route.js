const express = require("express");
const multer = require("multer");
const documentQAController = require("./documentQA.controller");
const clerkAuth = require("../../middlewares/clerkAuth");

const router = express.Router();

// Multer in-memory storage for PDF/TXT
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.mimetype === "text/plain") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and TXT files are allowed!"), false);
    }
  },
});

router.post("/upload", clerkAuth, upload.single("file"), documentQAController.uploadDocument);
router.post("/ask", clerkAuth, documentQAController.askQuestion);

module.exports = router;
