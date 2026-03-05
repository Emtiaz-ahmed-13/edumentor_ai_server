const sendResponse = require("../../utils/sendResponse");
const aiService = require("./ai.service");

const askQuestion = async (req, res, next) => {
  try {
    const { question, difficulty } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const result = await aiService.generateExplanation(question, difficulty);
    
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
