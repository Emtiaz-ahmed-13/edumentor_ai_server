const { generateAIResponse } = require("../services/geminiService_5");

const handleVoiceChat_5 = async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: "No input detected",
      });
    }

    const aiResponse = await generateAIResponse(transcript);

    res.status(200).json({
      success: true,
      data: aiResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "The AI Mentor is currently unavailable. Please try again in a moment.",
      error: error.message,
    });
  }
};

module.exports = {
  handleVoiceChat_5,
};
