const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['submitted', 'reviewing', 'interview', 'offered', 'rejected', 'accepted', 'withdrawn']
  },
  date: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    default: ''
  }
});

const jobApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true
  },
  linkedin: {
    type: String,
    default: ''
  },
  portfolio: {
    type: String,
    default: ''
  },
  resumePath: {
    type: String,
    required: true
  },
  coverLetterPath: {
    type: String,
    default: ''
  },
  referredBy: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    required: true,
    enum: ['submitted', 'reviewing', 'interview', 'offered', 'rejected', 'accepted', 'withdrawn'],
    default: 'submitted'
  },
  statusHistory: [statusHistorySchema],
  interviewDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient querying
jobApplicationSchema.index({ job: 1, user: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('JobApplication', jobApplicationSchema); 