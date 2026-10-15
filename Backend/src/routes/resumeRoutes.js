const express = require("express");

const { uploadResume: uploadResumeController } = require("../controller/resumeController");
const authMiddleware = require("../middleware/authMiddleware");
const {
  uploadResume,
  handleUploadError,
} = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post(
  "/upload",
  authMiddleware,
  uploadResume.single("resume"),
  uploadResumeController
);
router.use(handleUploadError);

module.exports = router;
