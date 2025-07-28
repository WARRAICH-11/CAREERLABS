const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const fs = require('fs');

const fileSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a file name'],
      trim: true
    },
    filename: {
      type: String,
      required: true,
      unique: true
    },
    mimetype: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sharedWith: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    description: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      enum: ['Document', 'Image', 'Video', 'Audio', 'Resume', 'Other'],
      default: 'Other'
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    lastDownloaded: {
      type: Date,
      default: null
    },
    associatedSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentorSession',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Create text index for searching
fileSchema.index({ name: 'text', description: 'text' });

// Add method to check if a user has access to a file
fileSchema.methods.hasAccess = function(userId) {
  const userIdStr = userId.toString();
  return (
    this.owner.toString() === userIdStr || 
    this.sharedWith.some(id => id.toString() === userIdStr)
  );
};

// Remove file from filesystem when document is deleted
fileSchema.pre('remove', function(next) {
  try {
    if (fs.existsSync(this.path)) {
      fs.unlinkSync(this.path);
    }
    next();
  } catch (error) {
    console.error('Error deleting file from filesystem:', error);
    next(error);
  }
});

// Apply pagination plugin
fileSchema.plugin(mongoosePaginate);

// Virtual for file extension
fileSchema.virtual('extension').get(function() {
  if (this.name) {
    const parts = this.name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }
  return '';
});

// Virtual for file type (based on mimetype)
fileSchema.virtual('type').get(function() {
  if (this.mimetype) {
    if (this.mimetype.startsWith('image/')) return 'image';
    if (this.mimetype.startsWith('video/')) return 'video';
    if (this.mimetype.startsWith('audio/')) return 'audio';
    if (this.mimetype === 'application/pdf') return 'pdf';
    if (this.mimetype.includes('document') || 
        this.mimetype.includes('spreadsheet') ||
        this.mimetype.includes('presentation')) return 'document';
  }
  return 'other';
});

module.exports = mongoose.model('File', fileSchema); 