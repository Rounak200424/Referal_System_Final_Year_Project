const path = require("path");
const multer = require("multer");

const MAX_RESUME_SIZE = 5 * 1024 * 1024;

const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_RESUME_SIZE,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const hasPdfExtension =
      path.extname(file.originalname).toLowerCase() === ".pdf";
    const hasPdfMimeType =
      (file.mimetype || "").toLowerCase() === "application/pdf";

    if (!hasPdfExtension || !hasPdfMimeType) {
      const error = new Error("Resume must be a PDF file.");
      error.code = "INVALID_RESUME_TYPE";
      return callback(error);
    }

    return callback(null, true);
  },
});

const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "Resume file must be 5 MB or smaller.",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: 'Upload exactly one file using the "resume" field.',
      });
    }

    return res.status(400).json({
      message: "Invalid resume upload request.",
    });
  }

  if (error && error.code === "INVALID_RESUME_TYPE") {
    return res.status(400).json({
      message: error.message,
    });
  }

  return next(error);
};

module.exports = {
  uploadResume,
  handleUploadError,
};
