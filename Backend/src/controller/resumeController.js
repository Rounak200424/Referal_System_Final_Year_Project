const { randomUUID } = require("crypto");
const { supabase, bucketName } = require("../config/supabase");

const uploadResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'A PDF resume file is required in the "resume" field.',
    });
  }

  if (!req.file.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    return res.status(400).json({
      message: "The uploaded file does not contain a valid PDF signature.",
    });
  }

  const userId = String(req.userId || "");
  if (!/^[a-f\d]{24}$/i.test(userId)) {
    return res.status(401).json({
      message: "Invalid authenticated user.",
    });
  }

  if (!bucketName) {
    console.error("Resume upload failed: SUPABASE_BUCKET is not configured.");
    return res.status(500).json({
      message: "Resume storage is not configured.",
    });
  }

  const resumePath = `${userId}/${randomUUID()}.pdf`;

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(resumePath, req.file.buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (error) {
      console.error("Resume storage upload failed:", error.statusCode || "unknown");
      return res.status(502).json({
        message: "Unable to store the resume. Please try again.",
      });
    }

    return res.status(201).json({
      message: "Resume uploaded successfully",
      resumePath,
    });
  } catch (error) {
    console.error(
      "Resume storage upload failed:",
      error && error.code ? error.code : "unexpected error"
    );
    return res.status(502).json({
      message: "Unable to store the resume. Please try again.",
    });
  }
};

module.exports = {
  uploadResume,
};
