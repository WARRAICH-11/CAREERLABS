const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['career-roadmap', 'assessment-result', 'resume', 'portfolio', 'general'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Assessment', 'Session', 'User']
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  recommendations: [{
    type: String
  }],
  strengths: [{
    type: String
  }],
  areasForImprovement: [{
    type: String
  }],
  resources: [{
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['file', 'link'],
      required: true
    },
    path: {
      type: String,
      required: true
    },
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  actionItems: [{
    description: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    timeline: {
      type: String
    }
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  userResponse: {
    content: String,
    submittedAt: Date
  }
}, {
  timestamps: true
});

// Create indexes for frequent queries
feedbackSchema.index({ mentor: 1, user: 1 });
feedbackSchema.index({ user: 1, isRead: 1 });
feedbackSchema.index({ type: 1, referenceId: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback; 