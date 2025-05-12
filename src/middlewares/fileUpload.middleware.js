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

// Middleware to delete previous .bin files in the temp folder
// Middleware to delete previous .bin files in the temp folder
const deletePreviousBinFiles = (req, res, next) => {
  const uploadDir = getUploadDir();
  
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        console.error('Error reading upload directory:', err);
        return next();
      }

      // Filter and delete previous .bin files
      files
        .filter((f) => f.endsWith('.bin'))
        .forEach((f) => {
          fs.unlink(path.join(uploadDir, f), (err) => {
            if (err) {
              console.error(`Failed to delete file ${f}:`, err);
            } else {
              console.log(`Deleted previous firmware file: ${f}`);
            }
          });
        });

      next();
    });
  } catch (error) {
    console.error('Error in deletePreviousBinFiles middleware:', error);
    next();
  }
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = getUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});


// Create multer upload middleware
export const upload = multer({ storage });

// Export the deletePreviousBinFiles middleware as well
export { deletePreviousBinFiles };
