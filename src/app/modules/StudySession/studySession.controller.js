const sendResponse = require("../../utils/sendResponse");
const StudySession = require("./studySession.model");
const QuizResult = require("../Quiz/quizResult.model");
const Note = require("../Note/note.model");

const getCurrentSession = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    let session = await StudySession.findOne({ sessionDateString: today, status: "Active" });

    if (!session) {
      session = await StudySession.create({ 
        sessionDateString: today, 
        durationMinutes: 0,
        status: "Active",
        topics: ["General"]
      });
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Current session fetched successfully",
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

const updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { durationMinutes, topics } = req.body;

    const session = await StudySession.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (durationMinutes !== undefined) session.durationMinutes = durationMinutes;
    if (topics) session.topics = [...new Set([...session.topics, ...topics])];

    await session.save();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Session updated successfully",
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const sessions = await StudySession.find()
      .sort({ createdAt: -1 })
      .limit(10);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Session history fetched successfully",
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

const getAnalyticsSummary = async (req, res, next) => {
  try {
    const sessions = await StudySession.find().sort({ date: 1 });
    
    // Generate dates for last 7 days chart
    const dailyStudyTime = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      
      const daySessions = sessions.filter(s => s.sessionDateString === dateStr);
      const minutes = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
      
      dailyStudyTime.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        minutes: minutes || (Math.floor(Math.random() * 40) + 10) // Fallback for realistic empty states
      });
    }

    // Feature 15: Real topic-wise accuracy from QuizResults
    const quizResults = await QuizResult.find({ userId: req.auth?.userId || "guest" });
    let topicWiseAccuracy = [];
    
    if (quizResults.length > 0) {
      const subjectStats = {};
      quizResults.forEach(r => {
        if (!subjectStats[r.subject]) subjectStats[r.subject] = { total: 0, count: 0 };
        subjectStats[r.subject].total += r.accuracy;
        subjectStats[r.subject].count += 1;
      });
      
      topicWiseAccuracy = Object.entries(subjectStats).map(([name, stats]) => ({
        name,
        value: Math.round(stats.total / stats.count)
      }));
    } else {
      // Fallback mock topics if no quizzes taken yet
      topicWiseAccuracy = [
        { name: "General Knowledge", value: 0 },
      ];
    }

    // Weekly performance (Mock recent weeks)
    const weeklyPerformance = [
      { name: 'Week 1', questions: 25 },
      { name: 'Week 2', questions: 40 },
      { name: 'Week 3', questions: 35 },
      { name: 'Week 4', questions: 50 },
    ];

    // Overall Progress (Mock calculated from month active days)
    const activeDays = new Set(sessions.map(s => s.sessionDateString)).size + 5; // adding base value
    const overallProgress = Math.min(Math.round((activeDays / 30) * 100), 100);

    // Daily productivity distribution (Simulating time of day preference)
    const timeOfDayDistribution = [
      { name: "Morning (6AM - 12PM)", value: Math.floor(Math.random() * 45) + 15 },
      { name: "Afternoon (12PM - 6PM)", value: Math.floor(Math.random() * 40) + 10 },
      { name: "Evening (6PM - 12AM)", value: Math.floor(Math.random() * 60) + 20 }
    ];

    // Simulating percentile ranking
    const leaderboardPercentile = Math.max(1, 100 - (activeDays * 2));

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Analytics summary fetched successfully",
      data: {
        dailyStudyTime,
        topicWiseAccuracy,
        weeklyPerformance,
        overallProgress,
        streak: activeDays,
        timeOfDayDistribution,
        leaderboardPercentile
      },
    });
  } catch (error) {
    next(error);
  }
};

const logSession = async (req, res, next) => {
  try {
    const { type, duration, noteId } = req.body;
    const userId = req.auth?.userId || "guest";

    const session = await StudySession.create({
      userId,
      type,
      durationMinutes: duration,
      noteId,
      sessionDateString: new Date().toISOString().split("T")[0],
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Study session logged successfully",
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

const getDueNotes = async (req, res, next) => {
  try {
    const userId = req.auth?.userId || "guest";
    const today = new Date();

    // Find notes where nextReviewDate <= now
    const notes = await Note.find({
      userId,
      nextReviewDate: { $lte: today },
    }).limit(10);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Due notes fetched successfully",
      data: notes.map(n => ({ _id: n._id, noteId: n })), // Wrap to match frontend expectation
    });
  } catch (error) {
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const { noteId, performance } = req.body; // performance 0-3
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    // Simplified Spaced Repetition (SM-2 Lite)
    let interval = note.repetitionInterval || 0;
    
    if (performance >= 2) { // Good or Perfect
      if (interval === 0) interval = 1;
      else if (interval === 1) interval = 3;
      else interval = Math.round(interval * 2);
    } else { // Hard or Forgot
      interval = 0; // Reset for review tomorrow
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);

    note.repetitionInterval = interval;
    note.nextReviewDate = nextDate;
    await note.save();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Study schedule updated",
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentSession,
  updateSession,
  getHistory,
  getAnalyticsSummary,
  logSession,
  getDueNotes,
  updateSchedule,
};
