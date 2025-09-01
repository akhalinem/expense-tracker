// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error response
  let statusCode = 500;
  let errorResponse = {
    error: 'Something went wrong. Please try again later.',
    code: 'INTERNAL_ERROR'
  };
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse.error = 'Validation failed';
    errorResponse.details = err.details;
  } else if (err.name === 'AuthError') {
    statusCode = 401;
    errorResponse.error = err.message || 'Authentication failed';
    errorResponse.code = err.code || 'AUTH_ERROR';
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    errorResponse.error = err.message;
    errorResponse.code = err.code;
  }
  
  res.status(statusCode).json(errorResponse);
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND'
  });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  requestLogger
};