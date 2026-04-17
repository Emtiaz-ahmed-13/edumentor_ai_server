const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const globalErrorHandler = require("./app/middlewares/globalErrorHandler");
const router = require("./app/routes");
const aiRoutes = require("../routes/aiRoutes_5");

const app = express();

// parsers
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["http://localhost:5173", "http://localhost:3000"];

app.use(cors({ origin: allowedOrigins, credentials: true }));

// application routes
app.use("/api/v1", router);
app.use("/api/ai", aiRoutes);

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
