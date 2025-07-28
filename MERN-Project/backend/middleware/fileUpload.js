const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
const categoryDirs = ['assignments', 'resources', 'materials', 'profiles', 'others'];

// Create base directory and category subdirectories
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  
  // Create category subdirectories
  categoryDirs.forEach(dir => {
    const categoryPath = path.join(uploadDir, dir);
    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath);
    }
  });
}

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const category = req.body.category || 'others';
    
    // Map category to valid directory
    let targetDir = 'others';
    if (categoryDirs.includes(category)) {
      targetDir = category;
    }
    
    const finalPath = path.join(uploadDir, targetDir);
    cb(null, finalPath);
  },
  filename: function(req, file, cb) {
    // Generate unique filename: timestamp + random string + original extension
    const randomString = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    const filename = `${timestamp}-${randomString}${fileExt}`;
    
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|mp4|mp3/;
  
  // Check extension
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Check mime type (broad check)
  const mimeCheck = file.mimetype.startsWith('image/') || 
                    file.mimetype.startsWith('application/') || 
                    file.mimetype.startsWith('text/') ||
                    file.mimetype.startsWith('audio/') ||
                    file.mimetype.startsWith('video/');
  
  if (extname && mimeCheck) {
    return cb(null, true);
  } else {
    return cb(new Error('File type not allowed. Please upload a supported file type.'));
  }
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB size limit
  },
  fileFilter: fileFilter
});

// Error handling middleware
const handleFileUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 50MB limit'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Multer upload error: ${err.message}`
    });
  } else if (err) {
    // An unknown error occurred
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // If no error, continue
  next();
};

module.exports = {
  upload,
  handleFileUploadError
}; 