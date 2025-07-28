const mongoose = require('mongoose');

// Set up mongoose options to handle deprecation warnings
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    // Define connection options to optimize for multiple applications
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Add connection pool settings
      maxPoolSize: 10, // Limit maximum connections
      minPoolSize: 2, // Keep minimum connections open
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      // Add unique app name for monitoring in Atlas
      appName: 'CAREERLABS-MAIN-APP',
      // Add server selection timeout
      serverSelectionTimeoutMS: 5000, // Give up initial connection after 5 seconds
      heartbeatFrequencyMS: 30000, // Check server health every 30 seconds
    };

    // Extract MONGODB_URI from environment variable or use default
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MongoDB connection string is not defined in environment variables');
    }

    // Establish MongoDB connection with optimized settings
    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Set up event handlers for connection issues
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established successfully');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 