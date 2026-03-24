const globalErrorHandler = (err, req, res, next) => {
  console.error("DEBUG BACKEND ERROR:", err);
  let statusCode = 500;
  let message = "Something went wrong !";
  let errorMessages = [];

  if (err?.name === "ValidationError") {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (err?.message === "Unauthenticated" || err?.status === 401 || err?.statusCode === 401) {
    // Clerk auth errors
    statusCode = 401;
    message = "Unauthorized: Please provide a valid authentication token.";
    errorMessages = [{ path: "", message: "Authentication required." }];
  } else if (err instanceof Error) {
    message = err?.message;
    errorMessages = err?.message
      ? [
          {
            path: "",
            message: err?.message,
          },
        ]
      : [];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.env !== "production" ? err?.stack : undefined,
  });
};

// Placeholder for handleValidationError - will implement properly later or import
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => {
    return {
      path: el?.path,
      message: el?.message,
    };
  });
  return {
    statusCode: 400,
    message: "Validation Error",
    errorMessages: errors,
  };
};

const config = require("../../config");

module.exports = globalErrorHandler;
