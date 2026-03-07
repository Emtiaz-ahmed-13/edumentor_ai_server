const sendResponse = require("../../utils/sendResponse");
const aiService = require("./ai.service");

const askQuestion = async (req, res, next) => {
  try {
    const { question, difficulty, conversationHistory } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    // conversationHistory is an optional array of {role, content} objects
    const history = Array.isArray(conversationHistory) ? conversationHistory : [];

    const result = await aiService.generateExplanation(question, difficulty, history);
    console.log("DEBUG BACKEND: AI Result:", JSON.stringify(result, null, 2));

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Explanation generated successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  askQuestion,
};
