const sendResponse = require("../../utils/sendResponse");
const Concept = require("./concept.model");

const getHistory = async (req, res, next) => {
  try {
    const concepts = await Concept.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select("-__v");

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Concept history fetched successfully",
      data: concepts,
    });
  } catch (error) {
    next(error);
  }
};

const getConceptById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const concept = await Concept.findById(id).select("-__v");

    if (!concept) {
      return res.status(404).json({
        success: false,
        message: "Concept not found",
      });
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Concept fetched successfully",
      data: concept,
    });
  } catch (error) {
    next(error);
  }
};

const updateConcept = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userNote } = req.body;

    const updates = {};
    if (typeof userNote === "string") updates.userNote = userNote.trim();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update (userNote allowed)",
      });
    }

    const concept = await Concept.findByIdAndUpdate(id, { $set: updates }, { new: true }).select("-__v");

    if (!concept) {
      return res.status(404).json({ success: false, message: "Concept not found" });
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Concept updated successfully",
      data: concept,
    });
  } catch (error) {
    next(error);
  }
};

const deleteConcept = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Concept.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Concept not found",
      });
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Concept deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHistory,
  getConceptById,
  updateConcept,
  deleteConcept,
};
