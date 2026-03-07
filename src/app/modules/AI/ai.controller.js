const sendResponse = require("../../utils/sendResponse");
const aiService = require("./ai.service");
const Concept = require("../Concept/concept.model");

/**
 * AI Controller - Handles AI explanation requests with conversation history
 */

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

    // Generate explanation via Gemini AI
    const result = await aiService.generateExplanation(question, difficulty, history);
    console.log("DEBUG BACKEND: AI Result generated for topic:", question);

    // Auto-save the result to MongoDB
    let savedConcept;
    try {
      savedConcept = await Concept.create({
        topic: result.question || question,
        difficultyLevel: result.difficulty || difficulty || "beginner",
        explanation: result.explanation,
        realLifeExample: result.realLifeExample,
        analogy: result.analogy,
        keyPoints: result.keyPoints,
        funFact: result.funFact || "",
        commonMisconception: result.commonMisconception || "",
      });
      console.log("DEBUG BACKEND: Concept saved to DB with ID:", savedConcept._id);
    } catch (dbError) {
      console.error("Warning: Failed to save concept to DB:", dbError.message);
      // Non-fatal - still return the AI result even if DB save fails
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Explanation generated successfully!",
      data: {
        ...result,
        _id: savedConcept?._id,
        topic: result.question || question,
        difficultyLevel: result.difficulty || difficulty || "beginner",
        createdAt: savedConcept?.createdAt || new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const analyzeCode = async (req, res, next) => {
  try {
    const { code, language, difficulty } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Code is required",
      });
    }

    const result = await aiService.analyzeCode(code, language, difficulty);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Code analyzed successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  askQuestion,
  analyzeCode,
};
