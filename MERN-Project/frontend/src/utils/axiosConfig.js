import axios from 'axios';

// Create a custom instance of axios with proper configuration
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This allows cookies to be sent with requests
  timeout: 15000, // Timeout after 15 seconds
});

// Add request interceptor to set authentication token and log requests
instance.interceptors.request.use(
  (config) => {
    // Add timestamp to track request timing
    config.metadata = { startTime: new Date() };
    
    // Ensure URL has correct format and fix any issues with auth paths
    let url = config.url || '';
    
    // If URL starts with /auth, replace it with /api/auth
    // This is needed because the baseURL already includes /api
    // but the code might be using /auth/ directly
    if (url.startsWith('/auth/') || url === '/auth') {
      // Remove the leading slash to avoid double slashes
      url = url.replace(/^\/auth/, 'auth');
      config.url = url;
      console.log('Fixed auth path to use correct format:', url);
    }
    
    // Make sure URL starts with / if it's not an absolute URL
    if (!url.startsWith('http') && !url.startsWith('/')) {
      config.url = `/${url}`;
    }
    
    // Log outgoing requests with FULL URL for debugging
    const fullUrl = `${config.baseURL}${config.url}`.replace(/([^:]\/)\/+/g, "$1"); // Remove any double slashes
    console.log(`🚀 REQUEST: ${config.method.toUpperCase()} ${fullUrl}`, { 
      params: config.params,
      data: config.data,
      fullUrl
    });
    
    // Set auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors and log responses
instance.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;
    
    // Log successful responses
    console.log(`✅ RESPONSE: ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`, { 
      data: response.data
    });
    
    return response;
  },
  (error) => {
    // Get request config
    const config = error.config || {};
    
    // Calculate request duration if metadata exists
    const duration = config.metadata ? new Date() - config.metadata.startTime : 0;
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`❌ RESPONSE ERROR: ${config.method?.toUpperCase()} ${config.url} - ${error.response.status} (${duration}ms)`, {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Handle 401 unauthorized errors (expired token, etc.)
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        // Optionally redirect to login
        // window.location.href = '/login';
      }
      
      // Handle database connection errors
      if (error.response.status === 500 && 
          (error.response.data?.message?.includes('MongoDB') || 
           error.response.data?.error?.includes('database'))) {
        console.error('⚠️ DATABASE CONNECTION ERROR - Please try again later');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`❌ NO RESPONSE: ${config.method?.toUpperCase()} ${config.url} (${duration}ms)`, {
        request: error.request
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error(`❌ REQUEST SETUP ERROR: ${error.message}`, {
        config: config
      });
    }
    
    return Promise.reject(error);
  }
);

export default instance; 