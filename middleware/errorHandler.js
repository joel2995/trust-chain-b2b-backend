import { logger } from "../utils/logger.js";

export const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // 🔴 Log error
  logger.error(err, "Global error handler caught error");

  // 🧼 Standard response
  res.status(statusCode).json({
    status: err.status || "error",
    message: err.message || "Something went wrong",
  });
};
