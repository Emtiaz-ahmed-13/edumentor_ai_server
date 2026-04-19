const express = require("express");
const router = express.Router();
const AuthRoutes = require("../modules/Auth/auth.route");
const AIRoutes = require("../modules/AI/ai.route");
const ConceptRoutes = require("../modules/Concept/concept.route");
const NoteRoutes = require("../modules/Note/note.route");
const StudySessionRoutes = require("../modules/StudySession/studySession.route");
const GoalRoutes = require("../modules/Goal/goal.route");
const QuizRoutes = require("../modules/Quiz/quiz.route");
const NotificationRoutes = require("../modules/Notification/notification.route");
const DocumentQARoutes = require("../modules/DocumentQA/documentQA.route");

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/ai",
    route: AIRoutes,
  },
  {
    path: "/concepts",
    route: ConceptRoutes,
  },
  {
    path: "/notes",
    route: NoteRoutes,
  },
  {
    path: "/study",
    route: StudySessionRoutes,
  },
  {
    path: "/goals",
    route: GoalRoutes,
  },
  {
    path: "/quizzes",
    route: QuizRoutes,
  },
  {
    path: "/notifications",
    route: NotificationRoutes,
  },
  {
    path: "/document-qa",
    route: DocumentQARoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

router.get("/", (req, res) => {
  res.send({
    success: true,
    message: "Edumentor AI API is running..",
  });
});

module.exports = router;
