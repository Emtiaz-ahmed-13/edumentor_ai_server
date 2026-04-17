const express = require("express");
const router = express.Router();
const AuthRoutes = require("../modules/Auth/auth.route");
const AIRoutes = require("../modules/AI/ai.route");
const ConceptRoutes = require("../modules/Concept/concept.route");
const DocumentQARoutes = require("../modules/DocumentQA/documentQA.route");
const NoteRoutes = require("../modules/Note/note.route");
const QuizRoutes = require("../modules/Quiz/quiz.route");
const StudyRoutes = require("../modules/Study/study.route");
const NotificationRoutes = require("../modules/Notification/notification.route");

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
    path: "/document-qa",
    route: DocumentQARoutes,
  },
  {
    path: "/quizzes",
    route: QuizRoutes,
  },
  {
    path: "/study",
    route: StudyRoutes,
  },
  {
    path: "/notifications",
    route: NotificationRoutes,
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