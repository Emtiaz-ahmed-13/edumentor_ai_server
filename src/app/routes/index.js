const express = require("express");
const router = express.Router();
const AuthRoutes = require("../modules/Auth/auth.route");

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

module.exports = router;
