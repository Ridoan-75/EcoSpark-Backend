// Global error handler middleware to catch and respond to errors uniformly.
import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import AppError from "./AppError";

const globalErrorHandler: ErrorRequestHandler = (
  err,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong!";
  let success = false;

  // Prisma known request error (e.g. unique constraint)
  if (err.code === "P2002") {
    statusCode = 409;
    message = "Duplicate entry — this record already exists.";
  }

  // Prisma not found error
  if (err.code === "P2025") {
    statusCode = 404;
    message = "Record not found.";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired. Please log in again.";
  }

  res.status(statusCode).json({
    success,
    message,
    error: process.env.NODE_ENV === "development" ? err : undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default globalErrorHandler;