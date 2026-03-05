const express = require("express");
const router = express.Router();
const AuthRoutes = require("../modules/Auth/auth.route");
const AIRoutes = require("../modules/AI/ai.route");

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/ai",
    route: AIRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

module.exports = router;
