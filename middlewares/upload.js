const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary");

// Create uploads directory if it doesn't exist
const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created upload directory: ${dir}`);
  }
};

// Cloudinary Storage configuration for PPT submissions
const pptStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hack-vinyas/ppt-submissions",
    allowed_formats: ["pdf", "ppt", "pptx"],
    resource_type: "raw", // Use raw for non-image files
    public_id: (req, file) => {
      const timestamp = Date.now();
      const uniqueId = uuidv4().substring(0, 8);
      const nameWithoutExt = path
        .parse(file.originalname)
        .name.replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 50);
      return `ppt-${timestamp}-${uniqueId}-${nameWithoutExt}`;
    },
  },
});

// Cloudinary Storage configuration for payment screenshots
const paymentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hack-vinyas/payment-screenshots",
    allowed_formats: ["jpg", "jpeg", "png"],
    resource_type: "image",
    transformation: [
      { width: 1500, height: 1500, crop: "limit", quality: "auto" },
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const uniqueId = uuidv4().substring(0, 8);
      return `payment-${timestamp}-${uniqueId}`;
    },
  },
});

// File filter for PPT files
const pptFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/vnd.ms-powerpoint", // .ppt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "application/pdf", // .pdf
  ];

  const allowedExtensions = [".ppt", ".pptx", ".pdf"];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(fileExt)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PPT, PPTX, and PDF files are allowed."
      ),
      false
    );
  }
};

// File filter for payment screenshots
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];

  const allowedExtensions = [".jpg", ".jpeg", ".png"];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(fileExt)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPG, JPEG, and PNG images are allowed."
      ),
      false
    );
  }
};

// Multer configurations
const uploadConfigs = {
  // PPT submission upload
  pptSubmission: multer({
    storage: pptStorage,
    fileFilter: pptFileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB (increased from 5MB)
      files: 1, // Only one file at a time
    },
  }),

  // Payment screenshot upload
  paymentScreenshot: multer({
    storage: paymentStorage,
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB (increased from 5MB)
      files: 1, // Only one file at a time
    },
  }),

  // General file upload (for admin use)
  general: multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "../uploads/general");
        createUploadDir(uploadPath);
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const uniqueId = uuidv4().substring(0, 8);
        const ext = path.extname(file.originalname);
        const filename = `${timestamp}-${uniqueId}${ext}`;
        cb(null, filename);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5, // Multiple files allowed
    },
  }),
};

// Middleware functions
const uploadMiddleware = {
  // Single PPT file upload with text fields
  uploadPPT: (req, res, next) => {
    uploadConfigs.pptSubmission.fields([
      { name: "pptFile", maxCount: 1 },
      { name: "email", maxCount: 1 },
      { name: "otp", maxCount: 1 },
    ])(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size allowed is 10MB.",
          });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            success: false,
            message: "Too many files. Only one file is allowed.",
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // Check if file was uploaded
      if (!req.files || !req.files.pptFile || req.files.pptFile.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded. Please select a PPT, PPTX, or PDF file.",
        });
      }

      const file = req.files.pptFile[0];

      // Add file metadata to request
      req.file = file; // Make it compatible with existing code
      req.fileData = {
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype,
        uploadDate: new Date(),
      };

      next();
    });
  },

  // Single payment screenshot upload
  uploadPaymentScreenshot: (req, res, next) => {
    uploadConfigs.paymentScreenshot.single("paymentScreenshot")(
      req,
      res,
      (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              success: false,
              message: "Image too large. Maximum size allowed is 5MB.",
            });
          }
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
          });
        } else if (err) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        // File is optional for payment screenshot
        if (req.file) {
          req.fileData = {
            originalName: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimeType: req.file.mimetype,
            uploadDate: new Date(),
          };
        }

        next();
      }
    );
  },

  // Multiple files upload for admin
  uploadMultiple: (req, res, next) => {
    uploadConfigs.general.array("files", 5)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message:
              "One or more files are too large. Maximum size allowed is 10MB per file.",
          });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            success: false,
            message: "Too many files. Maximum 5 files allowed.",
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // Process uploaded files
      if (req.files && req.files.length > 0) {
        req.filesData = req.files.map((file) => ({
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          size: file.size,
          mimeType: file.mimetype,
          uploadDate: new Date(),
        }));
      }

      next();
    });
  },
};

// Utility functions
const fileUtils = {
  // Delete file from filesystem
  deleteFile: (filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ File deleted: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Error deleting file: ${error.message}`);
      return false;
    }
  },

  // Get file info
  getFileInfo: (filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return {
          exists: true,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
        };
      }
      return { exists: false };
    } catch (error) {
      console.error(`❌ Error getting file info: ${error.message}`);
      return { exists: false, error: error.message };
    }
  },

  // Get file size in human readable format
  formatFileSize: (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  // Validate file extension
  validateExtension: (filename, allowedExtensions) => {
    const ext = path.extname(filename).toLowerCase();
    return allowedExtensions.includes(ext);
  },
};

module.exports = {
  uploadConfigs,
  uploadMiddleware,
  fileUtils,
};
