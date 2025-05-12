import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Function to get the appropriate upload directory
const getUploadDir = () => {
  // On Vercel, use /tmp directory
  if (process.env.VERCEL) {
    return '/tmp';
  }
  
  // On development, create a directory in system temp folder
  const uploadDir = path.join(os.tmpdir(), 'air-monitor-firmware');
  
  // Ensure the directory exists
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }
  
  return uploadDir;
};

const getPossibleUploadDirs = () => {
  return [
    process.env.VERCEL ? '/tmp' : null,
    path.join(os.tmpdir(), 'air-monitor-firmware'),
    path.join(process.cwd(), 'tmp')
  ].filter(Boolean); // Filter out null values
};

const ensureDirectoryExists = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    } else {
      // Test write access by creating a temp file
      const testFile = path.join(dirPath, `test-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log(`Directory ${dirPath} exists and is writable`);
    }
    return true;
  } catch (error) {
    console.error(`Error with directory ${dirPath}:`, error);
    return false;
  }
};

const getWritableUploadDir = () => {
  const possibleDirs = getPossibleUploadDirs();
  
  for (const dir of possibleDirs) {
    if (ensureDirectoryExists(dir)) {
      return dir;
    }
  }
  
  // Fallback to current working directory if all else fails
  const fallbackDir = path.join(process.cwd(), 'uploads');
  ensureDirectoryExists(fallbackDir);
  return fallbackDir;
};



// Middleware to delete previous .bin files in the temp folder
const deletePreviousBinFiles = (req, res, next) => {
  try {
    const uploadDir = getWritableUploadDir();
    console.log(`Using upload directory: ${uploadDir}`);
    
    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        console.error('Error reading directory:', err);
        return next();
      }
      
      // Log existing files
      console.log(`Files before deletion:`, files);
      
      // Delete previous firmware files
      const binFiles = files.filter(file => file.endsWith('.bin') || file.endsWith('.ino.bin'));
      
      for (const file of binFiles) {
        try {
          fs.unlinkSync(path.join(uploadDir, file));
          console.log(`Deleted previous firmware file: ${file}`);
        } catch (unlinkErr) {
          console.error(`Failed to delete file ${file}:`, unlinkErr);
        }
      }
      
      next();
    });
  } catch (error) {
    console.error('Error in deletePreviousBinFiles:', error);
    next();
  }
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = getWritableUploadDir();
    // Store the upload directory in req for later use
    req.uploadDir = uploadDir;
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Handle ESP binary files - retain original name
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max size
  }
});

// Export the deletePreviousBinFiles middleware as well
export { upload, deletePreviousBinFiles };
