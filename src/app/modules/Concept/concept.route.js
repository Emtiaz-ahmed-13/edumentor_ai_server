const express = require("express");
const conceptController = require("./concept.controller");

/**
 * Concept Routes
 * Student: Syed Muntazir Mehdi (ID: 22299525)
 * Feature 4 - EduMentor AI
 */

const router = express.Router();

// GET /api/v1/concepts/history
router.get("/history", conceptController.getHistory);

// GET /api/v1/concepts/:id
router.get("/:id", conceptController.getConceptById);

// DELETE /api/v1/concepts/:id
router.delete("/:id", conceptController.deleteConcept);

module.exports = router;
