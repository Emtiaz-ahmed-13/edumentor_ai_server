const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const globalErrorHandler = require("./app/middlewares/globalErrorHandler");
const router = require("./app/routes");

const app = express();

// parsers
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim()) 
  : ["http://localhost:5173", "http://localhost:3000"];

console.log("🚀 Allowed CORS Origins:", allowedOrigins);

app.use(cors({ 
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      console.error(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));

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
