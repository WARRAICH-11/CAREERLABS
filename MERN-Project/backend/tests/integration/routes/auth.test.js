/**
 * Authentication Routes Integration Tests
 * 
 * Tests for the authentication endpoints, including registration, login,
 * and password management functionality.
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Configure chai
chai.use(chaiHttp);

// Import test helpers
const { createUser, generateToken } = require('../../utils/testHelpers');

// Server to make requests to
let server;

// Import User model for direct database queries
const User = require('../../../models/User');

describe('Authentication API Routes', function() {
  this.timeout(10000); // Increase timeout for slower operations
  
  before(async () => {
    // Initialize the server
    delete require.cache[require.resolve('../../../server')];
    server = require('../../../server');
  });
  
  after(async () => {
    // Close the server to clean up
    if (server) {
      await mongoose.disconnect();
      server.close();
    }
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      // Arrange
      const userData = {
        name: 'Test Registration',
        email: 'register@example.com',
        password: 'Password123',
      };
      
      // Act
      const res = await chai.request(server)
        .post('/api/auth/register')
        .send(userData);
      
      // Assert
      expect(res).to.have.status(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('token');
      expect(res.body.user).to.have.property('name', userData.name);
      expect(res.body.user).to.have.property('email', userData.email);
      expect(res.body.user).to.not.have.property('password');
      
      // Verify user in database
      const user = await User.findOne({ email: userData.email });
      expect(user).to.exist;
      expect(user.role).to.equal('user'); // Default role
    });
    
    it('should return 400 if email is already registered', async () => {
      // Arrange
      const existingUser = await createUser();
      const userData = {
        name: 'Duplicate User',
        email: existingUser.email,
        password: 'Password123',
      };
      
      // Act
      const res = await chai.request(server)
        .post('/api/auth/register')
        .send(userData);
      
      // Assert
      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('already registered');
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Arrange - missing email
      const incompleteUserData = {
        name: 'Missing Email',
        password: 'Password123',
      };
      
      // Act
      const res = await chai.request(server)
        .post('/api/auth/register')
        .send(incompleteUserData);
      
      // Assert
      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
    });
    
    it('should return 400 if password is too short', async () => {
      // Arrange
      const userData = {
        name: 'Short Password',
        email: 'shortpw@example.com',
        password: 'short',
      };
      
      // Act
      const res = await chai.request(server)
        .post('/api/auth/register')
        .send(userData);
      
      // Assert
      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('password');
    });
  });
  
  describe('POST /api/auth/login', () => {
    it('should login user and return token', async () => {
      // Arrange
      const password = 'Password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await createUser({ password: hashedPassword });
      
      // Act
      const res = await chai.request(server)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: password
        });
      
      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('token');
      expect(res.body.user).to.have.property('email', user.email);
      expect(res.body.user).to.not.have.property('password');
    });
    
    it('should return 401 for invalid credentials', async () => {
      // Arrange
      const user = await createUser();
      
      // Act
      const res = await chai.request(server)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'wrongpassword'
        });
      
      // Assert
      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('Invalid credentials');
    });
    
    it('should return 404 for non-existent user', async () => {
      // Act
      const res = await chai.request(server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });
      
      // Assert
      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('not found');
    });
  });
  
  describe('GET /api/auth/me', () => {
    it('should return current user profile when authenticated', async () => {
      // Arrange
      const user = await createUser();
      const token = generateToken(user);
      
      // Act
      const res = await chai.request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('name', user.name);
      expect(res.body.data).to.have.property('email', user.email);
      expect(res.body.data).to.not.have.property('password');
    });
    
    it('should return 401 when not authenticated', async () => {
      // Act
      const res = await chai.request(server)
        .get('/api/auth/me');
      
      // Assert
      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
    });
  });
  
  describe('POST /api/auth/forgotpassword', () => {
    it('should initiate password reset process for existing user', async () => {
      // Arrange
      const user = await createUser();
      
      // Act
      const res = await chai.request(server)
        .post('/api/auth/forgotpassword')
        .send({ email: user.email });
      
      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      
      // Verify resetPasswordToken was set in database
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.resetPasswordToken).to.exist;
      expect(updatedUser.resetPasswordExpire).to.exist;
    });
    
    it('should return 404 for non-existent user', async () => {
      // Act
      const res = await chai.request(server)
        .post('/api/auth/forgotpassword')
        .send({ email: 'nonexistent@example.com' });
      
      // Assert
      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
    });
  });
  
  describe('PUT /api/auth/resetpassword/:resettoken', () => {
    it('should reset password with valid token', async () => {
      // Arrange
      const user = await createUser();
      const resetToken = crypto.randomBytes(20).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      // Set reset token in database
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();
      
      // Act
      const res = await chai.request(server)
        .put(`/api/auth/resetpassword/${resetToken}`)
        .send({ password: 'NewPassword123' });
      
      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('token');
      
      // Verify password was updated
      const updatedUser = await User.findById(user._id);
      const passwordMatch = await bcrypt.compare('NewPassword123', updatedUser.password);
      expect(passwordMatch).to.be.true;
      expect(updatedUser.resetPasswordToken).to.be.undefined;
      expect(updatedUser.resetPasswordExpire).to.be.undefined;
    });
    
    it('should return 400 for invalid/expired token', async () => {
      // Act
      const res = await chai.request(server)
        .put('/api/auth/resetpassword/invalidtoken')
        .send({ password: 'NewPassword123' });
      
      // Assert
      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
    });
  });
  
  describe('PUT /api/auth/updatepassword', () => {
    it('should update password for authenticated user', async () => {
      // Arrange
      const originalPassword = 'OriginalPassword123';
      const hashedPassword = await bcrypt.hash(originalPassword, 10);
      const user = await createUser({ password: hashedPassword });
      const token = generateToken(user);
      
      // Act
      const res = await chai.request(server)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: originalPassword,
          newPassword: 'NewPassword123'
        });
      
      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      
      // Verify password was updated
      const updatedUser = await User.findById(user._id);
      const passwordMatch = await bcrypt.compare('NewPassword123', updatedUser.password);
      expect(passwordMatch).to.be.true;
    });
    
    it('should return 401 for incorrect current password', async () => {
      // Arrange
      const user = await createUser();
      const token = generateToken(user);
      
      // Act
      const res = await chai.request(server)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword123'
        });
      
      // Assert
      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
    });
    
    it('should return 401 when not authenticated', async () => {
      // Act
      const res = await chai.request(server)
        .put('/api/auth/updatepassword')
        .send({
          currentPassword: 'CurrentPassword',
          newPassword: 'NewPassword123'
        });
      
      // Assert
      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
    });
  });
}); 