const sendResponse = require("../../utils/sendResponse");
const noteService = require("../Note/note.service");

// ─── Document-QA Upload Controller ─────────────────────────────────────────────
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please provide a PDF or TXT file.",
      });
    }

    const { buffer, originalname, mimetype } = req.file;
    console.log(`📄 Processing ${mimetype} for Document QA:`, originalname);

    let extractedText = "";
    let pageCount = 0;

    if (mimetype === "text/plain") {
      extractedText = buffer.toString("utf-8");
      pageCount = 1;
    } else {
      // Reuse extraction logic from Note service for PDFs
      const result = await noteService.extractTextFromBuffer(buffer);
      extractedText = result.text;
      pageCount = result.pageCount;
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Document processed successfully",
      data: {
        fileName: originalname,
        fullText: extractedText,
        pageCount,
      },
    });
  } catch (error) {
    console.error("Document QA Upload Error:", error);
    next(error);
  }
};

// ─── Document-QA Ask Controller ────────────────────────────────────────────────
const askQuestion = async (req, res, next) => {
  try {
    const { question, context, difficulty, conversationHistory } = req.body;

    if (!question || !context) {
      return res.status(400).json({
        success: false,
        message: "Question and document context are required",
      });
    }

    // Reuse generation logic from Note service (adapted for direct context)
    const answer = await noteService.generateAnswerFromNote(context, question);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Answer generated successfully",
      data: answer,
    });
  } catch (error) {
    console.error("Document QA Ask Error:", error);
    next(error);
  }
};

module.exports = {
  uploadDocument,
  askQuestion,
};
