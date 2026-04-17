const sendResponse = require("../../utils/sendResponse");
const documentQAService = require("./documentQA.service");

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { buffer, mimetype, originalname } = req.file;
    const extractedText = await documentQAService.extractTextFromBuffer(buffer, mimetype);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Document processed and text extracted successfully!",
      data: {
        fileName: originalname,
        textBatch: extractedText.substring(0, 500) + "...", 
        fullText: extractedText 
      },
    });
  } catch (error) {
    next(error);
  }
};

const askQuestion = async (req, res, next) => {
  try {
    const { question, context, difficulty, conversationHistory } = req.body;

    if (!question || !context) {
      return res.status(400).json({
        success: false,
        message: "Question and document context are required",
      });
    }

    const result = await documentQAService.answerFromDocument(
      context,
      question,
      difficulty,
      conversationHistory || []
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Answer generated successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  askQuestion,
};
