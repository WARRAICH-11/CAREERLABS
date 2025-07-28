/**
 * Utility function to wrap async route handlers for cleaner error handling
 * 
 * This eliminates the need for try/catch blocks in route handlers
 * by passing any errors to Express's next() function
 * which will then be handled by the error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler; 