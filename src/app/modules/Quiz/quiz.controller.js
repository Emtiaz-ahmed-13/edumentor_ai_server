const quizService = require("./quiz.service");

const submitQuiz = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const result = await quizService.saveQuizResult(userId, req.body);
    
    res.status(201).send({
      success: true,
      message: "Quiz result saved successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to save quiz result",
    });
  }
};

const getWeakTopics = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const analytics = await quizService.getWeakTopics(userId);
    
    res.status(200).send({
      success: true,
      message: "Weak topics fetched successfully",
      data: analytics,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to fetch weak topics",
    });
  }
};

module.exports = {
  submitQuiz,
  getWeakTopics,
};
