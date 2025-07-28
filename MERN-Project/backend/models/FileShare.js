const mongoose = require('mongoose');

const FileShareSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  category: {
    type: String,
    enum: ['profile', 'resume', 'assignment', 'resource', 'other'],
    default: 'other'
  },
  description: {
    type: String
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add index for searching files by user
FileShareSchema.index({ uploadedBy: 1, isDeleted: 1 });
FileShareSchema.index({ sharedWith: 1, isDeleted: 1 });
FileShareSchema.index({ sessionId: 1, isDeleted: 1 });

// Static method to get files uploaded by a user
FileShareSchema.statics.getFilesUploadedBy = async function(userId) {
  return this.find({ 
    uploadedBy: userId,
    isDeleted: false
  })
  .sort({ createdAt: -1 })
  .populate('uploadedBy', 'name email profileImage')
  .exec();
};

// Static method to get files shared with a user
FileShareSchema.statics.getFilesSharedWith = async function(userId) {
  return this.find({ 
    sharedWith: userId,
    isDeleted: false
  })
  .sort({ createdAt: -1 })
  .populate('uploadedBy', 'name email profileImage')
  .exec();
};

// Static method to get files associated with a session
FileShareSchema.statics.getSessionFiles = async function(sessionId) {
  return this.find({ 
    sessionId,
    isDeleted: false
  })
  .sort({ createdAt: -1 })
  .populate('uploadedBy', 'name email profileImage')
  .exec();
};

// Instance method to check if a user has access to a file
FileShareSchema.methods.hasAccess = function(userId) {
  // Creator always has access
  if (this.uploadedBy.toString() === userId.toString()) {
    return true;
  }
  
  // Check if file is public
  if (this.isPublic) {
    return true;
  }
  
  // Check if the user is in sharedWith array
  return this.sharedWith.some(id => id.toString() === userId.toString());
};

module.exports = mongoose.model('FileShare', FileShareSchema); 