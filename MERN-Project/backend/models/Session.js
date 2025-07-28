const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
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
  scheduledDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  sessionType: {
    type: String,
    enum: ['career-counseling', 'resume-review', 'interview-prep', 'skill-assessment', 'other'],
    required: true
  },
  meetingLink: {
    type: String
  },
  notes: {
    type: String
  },
  feedback: {
    user: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      submittedAt: Date
    },
    mentor: {
      comment: String,
      submittedAt: Date
    }
  },
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
    isCompleted: {
      type: Boolean,
      default: false
    },
    dueDate: Date
  }],
  cancellationReason: {
    type: String
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes for frequent queries
sessionSchema.index({ mentor: 1, user: 1 });
sessionSchema.index({ mentor: 1, scheduledDate: 1 });
sessionSchema.index({ user: 1, scheduledDate: 1 });
sessionSchema.index({ scheduledDate: 1, status: 1 });

// Create a method to check if a session can be cancelled
sessionSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const sessionDate = new Date(this.scheduledDate);
  
  // Calculate time difference in hours
  const diffInHours = (sessionDate - now) / (1000 * 60 * 60);
  
  // Can be cancelled if at least 24 hours in advance
  return diffInHours >= 24;
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session; 