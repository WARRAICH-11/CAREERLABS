const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'interviewed', 'offered', 'rejected'],
    default: 'pending'
  },
  resume: {
    type: String, // URL to resume
    required: true
  },
  coverLetter: {
    type: String
  },
  answers: [{
    question: String,
    answer: String
  }],
  notes: String,
  appliedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    required: true
  },
  shortDescription: {
    type: String,
    trim: true
  },
  responsibilities: [String],
  requirements: [String],
  preferredQualifications: [String],
  category: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'junior', 'mid', 'senior', 'executive'],
    default: 'mid'
  },
  educationRequirements: [String],
  skills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    isNegotiable: {
      type: Boolean,
      default: false
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'annual'],
      default: 'annual'
    }
  },
  benefits: [String],
  remote: {
    type: Boolean,
    default: false
  },
  location: {
    city: String,
    state: String,
    country: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    default: 'full-time'
  },
  applicationQuestions: [{
    question: String,
    required: Boolean
  }],
  deadline: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applications: [applicationSchema],
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  saved: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create a text index for searching
jobSchema.index({ 
  title: 'text', 
  description: 'text', 
  category: 'text', 
  industry: 'text',
  'location.city': 'text',
  'location.country': 'text'
});

// Methods
jobSchema.methods.hasApplied = function(userId) {
  return this.applications.some(application => 
    application.applicant.toString() === userId.toString()
  );
};

jobSchema.methods.isSavedByUser = function(userId) {
  return this.saved.some(id => id.toString() === userId.toString());
};

module.exports = mongoose.model('Job', jobSchema); 