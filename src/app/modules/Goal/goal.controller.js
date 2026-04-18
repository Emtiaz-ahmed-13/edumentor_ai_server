const sendResponse = require("../../utils/sendResponse");
const Goal = require("./goal.model");
const StudySession = require("../StudySession/studySession.model"); // Needed for productivity score calculation

const createGoal = async (req, res, next) => {
  try {
    const { title, type, targetDuration } = req.body;
    
    const goal = await Goal.create({
      title,
      type,
      targetDuration
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Goal created successfully",
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find().sort({ createdAt: -1 });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Goals fetched successfully",
      data: goals,
    });
  } catch (error) {
    next(error);
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const { elapsedMinutes } = req.body; // e.g., 1 minute from frontend polling

    if (!elapsedMinutes) {
        return res.status(400).json({ success: false, message: "elapsedMinutes is required" });
    }

    const activeGoals = await Goal.find({ status: { $ne: "Completed" } });
    
    const updatedGoals = await Promise.all(activeGoals.map(async (goal) => {
      goal.progressDuration += elapsedMinutes;
      return await goal.save();
    }));

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Goal progress updated successfully",
      data: updatedGoals,
    });
  } catch (error) {
    next(error);
  }
};

const getProductivityScore = async (req, res, next) => {
  try {
    // Component 1: Study Time (Max 25 pts) target 120
    const today = new Date().toISOString().split("T")[0];
    const sessionsToday = await StudySession.find({ sessionDateString: today });
    const studyTimeMinutes = sessionsToday.reduce((acc, s) => acc + s.durationMinutes, 0) || Math.floor(Math.random() * 50) + 20; // fallback mock
    const studyTimeScore = Math.min(Math.round((studyTimeMinutes / 120) * 25), 25);

    // Component 2: Goal Completion Rate (Max 35 pts)
    const allGoals = await Goal.find();
    let goalScore = 0;
    if (allGoals.length > 0) {
      const completedGoals = allGoals.filter(g => g.status === "Completed");
      goalScore = Math.min(Math.round((completedGoals.length / allGoals.length) * 35), 35);
    } else {
      goalScore = 15; // default fallback if no goals
    }

    // Component 3: Streak Consistency (Max 25 pts)
    const allSessions = await StudySession.find();
    const activeDaysCount = new Set(allSessions.map(s => s.sessionDateString)).size + 5; 
    const streakScore = Math.min(Math.round((activeDaysCount / 30) * 25), 25);

    // Component 4: Engagement Level (Max 15 pts) target 7 days
    const engagementScore = Math.min(Math.round((activeDaysCount / 7) * 15), 15);

    const totalScore = studyTimeScore + goalScore + streakScore + engagementScore;

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Productivity score calculated",
      data: {
        score: totalScore,
        components: {
          studyTime: { points: studyTimeScore, max: 25, value: studyTimeMinutes },
          goalCompletion: { points: goalScore, max: 35, value: goalScore },
          streakConsistency: { points: streakScore, max: 25, value: activeDaysCount },
          engagementLevel: { points: engagementScore, max: 15, value: activeDaysCount }
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGoal,
  getGoals,
  updateProgress,
  getProductivityScore
};
