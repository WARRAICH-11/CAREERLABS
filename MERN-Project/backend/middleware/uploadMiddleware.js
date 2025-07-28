const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create folder for specific document types
    let targetDir;
    if (file.fieldname === 'resume') {
      targetDir = path.join(uploadDir, 'resumes');
    } else if (file.fieldname === 'coverLetter') {
      targetDir = path.join(uploadDir, 'coverLetters');
    } else {
      targetDir = path.join(uploadDir, 'documents');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept pdf, doc, docx files for resumes and cover letters
  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

module.exports = upload; 