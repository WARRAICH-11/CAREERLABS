const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mentorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    specializations: [{
      type: String,
      required: true
    }],
    expertise: [{
      type: String
    }],
    yearsOfExperience: {
      type: Number,
      required: true
    },
    bio: {
      type: String,
      required: true
    },
    rate: {
      type: Number,
      default: 0
    },
    availability: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
      },
      slots: [{
        startTime: {
          type: String,
          required: true
        },
        endTime: {
          type: String,
          required: true
        },
        isBooked: {
          type: Boolean,
          default: false
        }
      }]
    }],
    education: [{
      degree: String,
      institution: String,
      year: Number
    }],
    certifications: [{
      name: String,
      issuer: String,
      year: Number
    }],
    languages: [{
      type: String
    }],
    rating: {
      average: {
        type: Number,
        default: 0
      },
      count: {
        type: Number,
        default: 0
      }
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    assignedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true
  }
);

// Create a text index for searching
mentorSchema.index({ 
  specializations: 'text', 
  expertise: 'text', 
  bio: 'text',
  'education.institution': 'text'
});

const Mentor = mongoose.model('Mentor', mentorSchema);

module.exports = Mentor; 