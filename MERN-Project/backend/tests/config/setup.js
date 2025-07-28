/**
 * Test Setup Configuration
 * 
 * This file configures the testing environment for backend tests
 * including environment variables, database connection, and global fixtures.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Load environment variables from .env.test if it exists
dotenv.config({ path: '.env.test' });

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRE = '1h';
process.env.PORT = 5001;

let mongoServer;

/**
 * Global setup before all tests
 */
before(async function() {
  this.timeout(60000); // Increase timeout for the memory server startup
  
  // Create an in-memory MongoDB instance for testing
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log(`MongoDB successfully connected to ${mongoUri}`);
});

/**
 * Clear database collections after each test
 */
afterEach(async function() {
  // Clear all collections after each test
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

/**
 * Global teardown after all tests
 */
after(async function() {
  // Close mongoose connection
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
  
  // Stop in-memory MongoDB server
  if (mongoServer) {
    await mongoServer.stop();
    console.log('MongoDB memory server stopped');
  }
}); 