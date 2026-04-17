const studyService = require("./study.service");

const logSession = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const session = await studyService.logSession(userId, req.body);
    res.status(201).send({
      success: true,
      message: "Study session logged successfully",
      data: session,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to log study session",
    });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { noteId, performance } = req.body;
    const schedule = await studyService.updateSchedule(userId, noteId, performance);
    res.status(200).send({
      success: true,
      message: "Revision schedule updated successfully",
      data: schedule,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to update revision schedule",
    });
  }
};

const getDueNotes = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const notes = await studyService.getDueNotes(userId);
    res.status(200).send({
      success: true,
      message: "Due notes fetched successfully",
      data: notes,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to fetch due notes",
    });
  }
};

module.exports = {
  logSession,
  updateSchedule,
  getDueNotes,
};
