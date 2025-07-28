/**
 * Authentication Middleware Tests
 * 
 * Unit tests for authMiddleware.js which handles route protection,
 * authorization, and mentor role verification.
 */

const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Import the middleware to test
const { protect, authorize, mentorOnly } = require('../../../middleware/authMiddleware');

// Import test utilities
const { createUser, createAdminUser, createMentor } = require('../../utils/testHelpers');

describe('Authentication Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Set up request, response, and next function mocks
    req = {
      headers: {},
      cookies: {},
      query: {}
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
    
    next = sinon.spy();
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('protect middleware', () => {
    it('should return 401 if no token is provided', async () => {
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].success).to.be.false;
      expect(res.json.firstCall.args[0].message).to.equal('Not authorized to access this resource');
      expect(next.called).to.be.false;
    });
    
    it('should return 401 if token is invalid', async () => {
      // Arrange
      req.headers.authorization = 'Bearer invalidtoken';
      sinon.stub(jwt, 'verify').throws(new Error('Invalid token'));
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].success).to.be.false;
      expect(next.called).to.be.false;
    });
    
    it('should proceed if token is valid in authorization header', async () => {
      // Arrange
      const user = await createUser();
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );
      req.headers.authorization = `Bearer ${token}`;
      
      sinon.stub(jwt, 'verify').returns({ id: user._id });
      
      // Mock User.findById
      const userFindByIdStub = sinon.stub(mongoose.Model, 'findById');
      userFindByIdStub.returns({
        exec: sinon.stub().resolves(user)
      });
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(next.calledOnce).to.be.true;
      expect(req.user).to.exist;
    });
    
    it('should proceed if token is valid in cookie', async () => {
      // Arrange
      const user = await createUser();
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );
      req.cookies.token = token;
      
      sinon.stub(jwt, 'verify').returns({ id: user._id });
      
      // Mock User.findById
      const userFindByIdStub = sinon.stub(mongoose.Model, 'findById');
      userFindByIdStub.returns({
        exec: sinon.stub().resolves(user)
      });
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(next.calledOnce).to.be.true;
      expect(req.user).to.exist;
    });
    
    it('should proceed if token is valid in query string', async () => {
      // Arrange
      const user = await createUser();
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );
      req.query.token = token;
      
      sinon.stub(jwt, 'verify').returns({ id: user._id });
      
      // Mock User.findById
      const userFindByIdStub = sinon.stub(mongoose.Model, 'findById');
      userFindByIdStub.returns({
        exec: sinon.stub().resolves(user)
      });
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(next.calledOnce).to.be.true;
      expect(req.user).to.exist;
    });
    
    it('should return 401 if user not found', async () => {
      // Arrange
      const id = mongoose.Types.ObjectId();
      const token = jwt.sign(
        { id },
        process.env.JWT_SECRET || 'test-jwt-secret'
      );
      req.headers.authorization = `Bearer ${token}`;
      
      sinon.stub(jwt, 'verify').returns({ id });
      
      // Mock User.findById to return null
      const userFindByIdStub = sinon.stub(mongoose.Model, 'findById');
      userFindByIdStub.returns({
        exec: sinon.stub().resolves(null)
      });
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].success).to.be.false;
      expect(next.called).to.be.false;
    });
  });
  
  describe('authorize middleware', () => {
    it('should return 401 if user is not provided in request', () => {
      // Arrange
      const authorizeMiddleware = authorize('admin');
      
      // Act
      authorizeMiddleware(req, res, next);
      
      // Assert
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].success).to.be.false;
      expect(next.called).to.be.false;
    });
    
    it('should return 403 if user role is not authorized', () => {
      // Arrange
      req.user = { role: 'user' };
      const authorizeMiddleware = authorize('admin');
      
      // Act
      authorizeMiddleware(req, res, next);
      
      // Assert
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].success).to.be.false;
      expect(next.called).to.be.false;
    });
    
    it('should proceed if user role is authorized', () => {
      // Arrange
      req.user = { role: 'admin' };
      const authorizeMiddleware = authorize('admin');
      
      // Act
      authorizeMiddleware(req, res, next);
      
      // Assert
      expect(next.calledOnce).to.be.true;
    });
    
    it('should proceed if user role is one of multiple authorized roles', () => {
      // Arrange
      req.user = { role: 'mentor' };
      const authorizeMiddleware = authorize('admin', 'mentor');
      
      // Act
      authorizeMiddleware(req, res, next);
      
      // Assert
      expect(next.calledOnce).to.be.true;
    });
  });
  
  describe('mentorOnly middleware', () => {
    it('should return 403 if mentor profile not found', async () => {
      // Arrange
      req.user = { _id: mongoose.Types.ObjectId() };
      
      // Mock Mentor.findOne to return null
      const mentorFindOneStub = sinon.stub(mongoose.Model, 'findOne');
      mentorFindOneStub.returns({
        exec: sinon.stub().resolves(null)
      });
      
      // Act
      await mentorOnly(req, res, next);
      
      // Assert
      expect(res.status.calledWith(403)).to.be.true;
      expect(next.called).to.be.false;
    });
    
    it('should proceed if mentor profile found', async () => {
      // Arrange
      req.user = { _id: mongoose.Types.ObjectId() };
      const mentorProfile = { _id: mongoose.Types.ObjectId(), user: req.user._id };
      
      // Mock Mentor.findOne to return a mentor profile
      const mentorFindOneStub = sinon.stub(mongoose.Model, 'findOne');
      mentorFindOneStub.returns({
        exec: sinon.stub().resolves(mentorProfile)
      });
      
      // Act
      await mentorOnly(req, res, next);
      
      // Assert
      expect(next.calledOnce).to.be.true;
      expect(req.mentor).to.equal(mentorProfile);
    });
  });
}); 