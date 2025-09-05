import { Request, Response, NextFunction } from "express";

interface ICustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

// Global error handler middleware
export const errorHandler = (
  err: ICustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error:", err);

  // Default error response
  let statusCode = 500;
  let errorResponse: {
    error: string;
    code: string;
    details?: unknown;
  } = {
    error: "Something went wrong. Please try again later.",
    code: "INTERNAL_ERROR",
  };

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    errorResponse.error = "Validation failed";
    errorResponse.details = err.details;
  } else if (err.name === "AuthError") {
    statusCode = 401;
    errorResponse.error = err.message || "Authentication failed";
    errorResponse.code = err.code || "AUTH_ERROR";
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    errorResponse.error = err.message;
    errorResponse.code = err.code || "UNKNOWN_ERROR";
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: "Route not found",
    code: "NOT_FOUND",
  });
};

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
};
