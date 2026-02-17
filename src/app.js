const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const globalErrorHandler = require("./app/middlewares/globalErrorHandler");
const router = require("./app/routes");

const app = express();

// parsers
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// application routes
app.use("/api/v1", router);

app.get("/", (req, res) => {
  res.send({
    message: "Edumentor server is running..",
  });
});

// global error handler
app.use(globalErrorHandler);

// handle not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API Not Found",
      },
    ],
  });
});

module.exports = app;
