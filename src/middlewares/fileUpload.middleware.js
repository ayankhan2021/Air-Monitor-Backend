import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Middleware to delete previous .bin files in the temp folder
const deletePreviousBinFiles = (req, res, next) => {
  const uploadDir = '/tmp';

  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to read upload directory' });
    }

    // Filter and delete previous .bin files
    files
      .filter((f) => f.endsWith('.bin'))  // Delete all .bin files
      .forEach((f) => {
        fs.unlink(path.join(uploadDir, f), (err) => {
          if (err) {
            console.error(`Failed to delete file ${f}:`, err);
          }
        });
      });

    // Proceed to the next middleware (file upload)
    next();
  });
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp');  // Temp folder
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);  // Use the original filename
  },
});

// Create multer upload middleware
export const upload = multer({ storage });

// Export the deletePreviousBinFiles middleware as well
export { deletePreviousBinFiles };
