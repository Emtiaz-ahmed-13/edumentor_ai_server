const express = require("express");
const conceptController = require("./concept.controller");
const router = express.Router();

router.get("/history", conceptController.getHistory);
router.get("/:id", conceptController.getConceptById);
router.delete("/:id", conceptController.deleteConcept);
module.exports = router;
