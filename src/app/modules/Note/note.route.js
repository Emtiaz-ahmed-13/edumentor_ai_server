const express = require("express");
const multer = require("multer");
const noteController = require("./note.controller");
const clerkAuth = require("../../middlewares/clerkAuth");

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  },
});

router.post("/upload", clerkAuth, upload.single("pdf"), noteController.uploadNote);
router.get("/", clerkAuth, noteController.getAllNotes);
router.get("/:id", clerkAuth, noteController.getNoteById);
router.patch("/:id", clerkAuth, noteController.updateNote);
router.delete("/:id", clerkAuth, noteController.deleteNote);
router.post("/:id/ask", clerkAuth, noteController.askFromNote);

module.exports = router;
