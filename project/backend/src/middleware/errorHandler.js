const logger = require('../config/logger');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let errors = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errors = err.details || err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Referenced resource does not exist';
  } else if (err.code === '23502') { // PostgreSQL not null violation
    statusCode = 400;
    message = 'Required field is missing';
  } else if (err.code === '42P01') { // PostgreSQL undefined table
    statusCode = 500;
    message = 'Database table not found';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Database connection failed';
  } else if (err.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'Service unavailable';
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
    errors = null;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};

