const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    type: String // URL to company logo
  },
  website: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+'],
  },
  founded: {
    type: Number
  },
  headquarters: {
    type: String,
    trim: true
  },
  locations: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  contactEmail: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
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

// Virtual for jobs posted by this company
companySchema.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'company'
});

// Create a text index for searching
companySchema.index({ 
  name: 'text', 
  description: 'text', 
  industry: 'text',
  headquarters: 'text'
});

module.exports = mongoose.model('Company', companySchema); 