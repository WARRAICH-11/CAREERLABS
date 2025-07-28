/**
 * Error handling middleware for the Express application
 */

// Middleware for handling 404 (Not Found) errors
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware for handling all other errors
const errorHandler = (err, req, res, next) => {
  // Set the status code (use 500 if the status is 200)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log the error
  console.error(`Error: ${err.message}`);
  console.error(err.stack);
  
  // Respond with the error details
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    // Additional information that might be useful for debugging
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

module.exports = {
  notFound,
  errorHandler
}; 