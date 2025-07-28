const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const http = require('http');
const socketIo = require('socket.io');

// Import routes
const testRoutes = require('./routes/test');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const assessmentRoutes = require('./routes/assessment');
const importRoutes = require('./routes/import');
const recommendationRoutes = require('./routes/recommendation');
const companyRoutes = require('./routes/company');
const jobRoutes = require('./routes/job');
const jobApplicationRoutes = require('./routes/jobApplicationRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const fileRoutes = require('./routes/fileRoutes');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true // Allow cookies to be sent
}));
app.use(express.json());
app.use(cookieParser());

// Make io accessible to our routes
app.set('io', io);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check endpoint for deployment monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Define port
const PORT = process.env.PORT || 5000;

// Mount routes
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/import', importRoutes);
app.use('/api/recommendation', recommendationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', jobApplicationRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);

// Basic route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World from the MERN Stack API!' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, 'public')));

  // Any route that is not an API route should redirect to index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
    } else {
      res.status(404).json({ message: 'API endpoint not found' });
    }
  });
}

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      // Verify JWT token (you can import your existing auth functions)
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      
      // Associate socket with user
      socket.userId = decoded.id;
      socket.join(`user-${decoded.id}`); // Join user's private room
      
      // Join room based on user role
      if (decoded.role) {
        socket.join(`role-${decoded.role}`);
      }
      
      console.log(`Socket ${socket.id} authenticated as user ${decoded.id}`);
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
    }
  });

  // Chat message handler
  socket.on('sendMessage', async (data) => {
    try {
      const { recipientId, message } = data;
      
      if (!socket.userId) {
        return socket.emit('error', { message: 'Not authenticated' });
      }
      
      // Save message to database (will be implemented in the message model)
      // const savedMessage = await Message.create({ ... });
      
      // Emit to recipient
      io.to(`user-${recipientId}`).emit('newMessage', {
        senderId: socket.userId,
        message,
        timestamp: new Date()
      });
      
    } catch (err) {
      console.error('Error sending message:', err.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Typing indicator
  socket.on('typing', (data) => {
    const { recipientId } = data;
    io.to(`user-${recipientId}`).emit('userTyping', { userId: socket.userId });
  });
  
  // Stop typing indicator
  socket.on('stopTyping', (data) => {
    const { recipientId } = data;
    io.to(`user-${recipientId}`).emit('userStoppedTyping', { userId: socket.userId });
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Add MongoDB connection monitoring
const monitorDatabaseConnection = () => {
  const mongoose = require('mongoose');
  
  // Check connection status periodically
  setInterval(() => {
    const state = mongoose.connection.readyState;
    switch (state) {
      case 0:
        console.error('MongoDB disconnected. Attempting to reconnect...');
        break;
      case 1:
        // Connected - all good
        break;
      case 2:
        console.log('MongoDB connecting...');
        break;
      case 3:
        console.error('MongoDB disconnecting...');
        break;
      default:
        console.error('MongoDB unknown connection state:', state);
    }
  }, 30000); // Check every 30 seconds
};

// Custom error handler middleware
const customErrorHandler = (err, req, res, next) => {
  console.error('Server Error:', err);
  
  // Check for MongoDB connection errors
  if (
    err.name === 'MongoError' || 
    err.name === 'MongoNetworkError' ||
    (err.message && err.message.includes('MongoDB'))
  ) {
    return res.status(503).json({
      success: false,
      error: 'Database connection error',
      message: 'Unable to connect to the database. Please try again later.',
      isDbError: true
    });
  }
  
  // Default error response
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};

// Not found middleware
const customNotFound = (req, res, next) => {
  // Skip for client-side routes in production
  if (process.env.NODE_ENV === 'production' && !req.path.startsWith('/api/')) {
    return next();
  }
  
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error handling middleware
app.use(customNotFound);
app.use(customErrorHandler);

// Connect to MongoDB first, then start the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start monitoring database connection
    monitorDatabaseConnection();
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      console.log(`API available at http://localhost:${PORT}/api`);
      if (process.env.NODE_ENV === 'production') {
        console.log(`Frontend served from ${path.join(__dirname, 'public')}`);
      }
    });
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

// Start the server
startServer(); 