const sendResponse = require("../../utils/sendResponse");
const aiService = require("./ai.service");
const Concept = require("../Concept/concept.model");

/**
 * AI Controller - Handles AI explanation requests
 * Student: Syed Muntazir Mehdi (ID: 22299525)
 * Feature 4 - EduMentor AI
 */

const askQuestion = async (req, res, next) => {
  try {
    const { question, difficulty } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    // Generate explanation via Gemini AI
    const result = await aiService.generateExplanation(question, difficulty);
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

    // Return AI result with the saved concept's _id if available
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

module.exports = {
  askQuestion,
};
