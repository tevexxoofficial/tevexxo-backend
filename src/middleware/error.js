const ApiError = require('../utils/ApiError');
const env = require('../config/env');

function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Centralized error handler - always JSON
function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  const details = err.details;

  if (!err.statusCode) {
    if (err.name === 'CastError') {
      statusCode = 400;
      message = `Invalid id format: ${err.value}`;
    } else if (err.name === 'ValidationError') {
      statusCode = 400;
      message = Object.values(err.errors)
        .map((e) => e.message)
        .join('. ');
    } else if (err.code === 11000) {
      statusCode = 409;
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      message = `Duplicate value for ${field}: "${Object.values(err.keyValue || {})[0]}"`;
    } else if (err.type === 'entity.parse.failed') {
      statusCode = 400;
      message = 'Invalid JSON body';
    }
  }

  if (statusCode >= 500) console.error('[error]', err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.nodeEnv === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };
