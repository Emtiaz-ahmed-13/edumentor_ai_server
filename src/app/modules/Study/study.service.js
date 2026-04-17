const StudySession = require("./study.model");
const RevisionSchedule = require("./revision.model");

/**
 * Logs a study session (focus, recall, or revision).
 */
const logSession = async (userId, data) => {
  return await StudySession.create({
    userId,
    ...data,
  });
};

/**
 * Updates or creates a revision schedule for a note.
 * Uses a simplified Spaced Repetition algorithm.
 * Performance levels: 0 (forgot), 1 (hard), 2 (good), 3 (perfect)
 */
const updateSchedule = async (userId, noteId, performance) => {
  let schedule = await RevisionSchedule.findOne({ userId, noteId });

  if (!schedule) {
    // Initial schedule: review tomorrow
    schedule = new RevisionSchedule({
      userId,
      noteId,
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      interval: 1,
      repetition: 1,
    });
  } else {
    // Update logic
    if (performance >= 2) {
      // Correct answer: Increase interval
      if (schedule.repetition === 0) {
        schedule.interval = 1;
      } else if (schedule.repetition === 1) {
        schedule.interval = 4;
      } else {
        schedule.interval = Math.round(schedule.interval * schedule.easeFactor);
      }
      schedule.repetition += 1;
      
      // Adjust ease factor based on performance
      if (performance === 3) schedule.easeFactor += 0.1;
      if (performance === 2) schedule.easeFactor -= 0.1;
    } else {
      // Incorrect answer: reset interval
      schedule.interval = 1;
      schedule.repetition = 0;
      schedule.easeFactor = Math.max(1.3, schedule.easeFactor - 0.2);
    }

    schedule.nextReviewDate = new Date(Date.now() + schedule.interval * 24 * 60 * 60 * 1000);
  }

  await schedule.save();
  return schedule;
};

/**
 * Gets all notes due for review for a specific user.
 */
const getDueNotes = async (userId) => {
  const now = new Date();
  const schedules = await RevisionSchedule.find({
    userId,
    nextReviewDate: { $lte: now },
  }).populate({
    path: "noteId",
    select: "title summary subject createdAt",
  });

  return schedules;
};

/**
 * Initializes a revision schedule for a new note.
 */
const initSchedule = async (userId, noteId) => {
  return await RevisionSchedule.findOneAndUpdate(
    { userId, noteId },
    {
      userId,
      noteId,
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Review tomorrow
      interval: 1,
      repetition: 1,
    },
    { upsert: true, new: true }
  );
};

module.exports = {
  logSession,
  updateSchedule,
  getDueNotes,
  initSchedule,
};
