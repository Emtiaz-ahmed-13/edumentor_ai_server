const QuizResult = require("./quiz.model");

/**
 * Saves a new quiz result to the database.
 */
const saveQuizResult = async (userId, data) => {
  const result = await QuizResult.create({
    userId,
    ...data,
  });
  return result;
};

/**
 * Calculates weak topics based on user's quiz history.
 * Groups by subject and calculates accuracy.
 * Subjects with accuracy < 70% are considered weak areas.
 */
const getWeakTopics = async (userId) => {
  const results = await QuizResult.find({ userId });

  if (results.length === 0) {
    return {
      totalQuizzes: 0,
      weakTopics: [],
      performanceData: [],
    };
  }

  const subjectStats = {};

  results.forEach((res) => {
    const sub = res.subject || "General";
    if (!subjectStats[sub]) {
      subjectStats[sub] = {
        subject: sub,
        correct: 0,
        total: 0,
        quizzesCount: 0,
      };
    }
    subjectStats[sub].correct += res.score;
    subjectStats[sub].total += res.totalQuestions;
    subjectStats[sub].quizzesCount += 1;
  });

  const performanceData = Object.values(subjectStats).map((stat) => {
    const accuracy = (stat.correct / stat.total) * 100;
    return {
      ...stat,
      accuracy: Math.round(accuracy),
    };
  });

  // Weak topics are those with less than 70% accuracy
  const weakTopics = performanceData.filter((data) => data.accuracy < 70);

  return {
    totalQuizzes: results.length,
    weakTopics,
    performanceData,
  };
};

module.exports = {
  saveQuizResult,
  getWeakTopics,
};
