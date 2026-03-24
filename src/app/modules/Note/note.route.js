const express = require('express');
const multer = require('multer');
const noteController = require('./note.controller');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('pdf'), noteController.uploadAndSummarize);
router.post('/ask', noteController.askQuestion);

module.exports = router;
