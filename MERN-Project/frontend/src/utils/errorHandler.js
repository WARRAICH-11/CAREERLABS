/**
 * Error handler utility functions for the application
 */

// Log error to console with additional context
export const logError = (error, componentName = 'Unknown', additionalContext = {}) => {
  console.error(
    `Error in ${componentName}:`,
    {
      message: error.message,
      stack: error.stack,
      ...additionalContext
    }
  );
  
  // Here you could also send the error to an error tracking service like Sentry
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorService(error, componentName, additionalContext);
  // }
};

// Format API error messages
export const formatApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return `Server error: ${error.response.status} ${error.response.data.message || 'Unknown error'}`;
  } else if (error.request) {
    // The request was made but no response was received
    return 'No response received from server. Please check your connection.';
  } else {
    // Something happened in setting up the request that triggered an Error
    return `Error: ${error.message}`;
  }
};

// Parse API errors
export const parseApiError = (error) => {
  if (!error) {
    return { message: 'Unknown error occurred' };
  }
  
  // Axios error
  if (error.response) {
    return { 
      status: error.response.status,
      message: error.response.data.message || error.message,
      data: error.response.data
    };
  }
  
  return { message: error.message || 'Unknown error occurred' };
};

export default {
  logError,
  formatApiError,
  parseApiError
}; 