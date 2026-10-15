const mongoose = require("mongoose");
const Application = require("../models/Application");
const Referral = require("../models/referal");
const { supabase, bucketName } = require("../config/supabase");

const RESUME_PATH_PATTERN =
  /^[a-f\d]{24}\/[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}\.pdf$/i;
const PDF_SIGNATURE = Buffer.from("%PDF-");

const submitApplication = async (req, res) => {
  const { referralId, resumePath } = req.body || {};
  const applicantId = req.userId;

  if (!referralId || !resumePath) {
    return res.status(400).json({
      message: "referralId and resumePath are required.",
    });
  }

  if (
    typeof referralId !== "string" ||
    !mongoose.isObjectIdOrHexString(referralId)
  ) {
    return res.status(400).json({
      message: "referralId must be a valid MongoDB ObjectId.",
    });
  }

  if (!mongoose.isValidObjectId(applicantId)) {
    return res.status(401).json({
      message: "Invalid authenticated user.",
    });
  }

  const normalizedResumePath =
    typeof resumePath === "string" ? resumePath.trim() : "";
  if (!RESUME_PATH_PATTERN.test(normalizedResumePath)) {
    return res.status(400).json({
      message: "resumePath must be a valid private PDF path for your account.",
    });
  }

  if (!normalizedResumePath.startsWith(`${applicantId}/`)) {
    return res.status(403).json({
      message: "You can only use a resume uploaded to your own account.",
    });
  }

  try {
    const referral = await Referral.findById(referralId).select(
      "_id createdBy applicantLimit"
    );

    if (!referral) {
      return res.status(404).json({
        message: "Referral not found.",
      });
    }

    if (String(referral.createdBy) === String(applicantId)) {
      return res.status(400).json({
        message: "You cannot apply to your own referral.",
      });
    }

    const existingApplication = await Application.exists({
      referralId: referral._id,
      applicantId,
    });

    if (existingApplication) {
      return res.status(409).json({
        message: "You have already applied to this referral.",
      });
    }

    if (!bucketName) {
      console.error("Application submission failed: SUPABASE_BUCKET is not configured.");
      return res.status(500).json({
        message: "Resume storage is not configured.",
      });
    }

    const { data: resumeFile, error: resumeError } = await supabase.storage
      .from(bucketName)
      .download(normalizedResumePath);

    if (resumeError) {
      if (String(resumeError.statusCode) === "404") {
        return res.status(400).json({
          message: "The selected resume was not found in your private storage.",
        });
      }

      console.error(
        "Application resume verification failed:",
        resumeError.statusCode || "unknown"
      );
      return res.status(502).json({
        message: "Unable to verify the selected resume. Please try again.",
      });
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        message: "The selected resume exceeds the 5 MB file size limit.",
      });
    }

    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
    if (!resumeBuffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)) {
      return res.status(400).json({
        message: "The selected resume is not a valid PDF file.",
      });
    }

    const reservedReferral = await Referral.findOneAndUpdate(
      {
        _id: referral._id,
        $expr: {
          $lt: [
            { $ifNull: ["$applicationsCount", 0] },
            "$applicantLimit",
          ],
        },
      },
      {
        $inc: { applicationsCount: 1 },
      },
      {
        new: true,
      }
    );

    if (!reservedReferral) {
      const referralStillExists = await Referral.exists({ _id: referral._id });

      if (!referralStillExists) {
        return res.status(404).json({
          message: "Referral not found.",
        });
      }

      return res.status(409).json({
        message: "This referral has reached its applicant limit.",
      });
    }

    let application;
    try {
      application = await Application.create({
        referralId: referral._id,
        applicantId,
        resumePath: normalizedResumePath,
        status: "PENDING",
      });
    } catch (error) {
      try {
        await Referral.updateOne(
          { _id: referral._id, applicationsCount: { $gt: 0 } },
          { $inc: { applicationsCount: -1 } }
        );
      } catch (rollbackError) {
        console.error(
          "Application count rollback failed:",
          rollbackError && rollbackError.code
            ? rollbackError.code
            : "unexpected error"
        );
      }

      if (error && error.code === 11000) {
        return res.status(409).json({
          message: "You have already applied to this referral.",
        });
      }

      throw error;
    }

    return res.status(201).json({
      message: "Application submitted successfully.",
      application: {
        applicationId: application._id,
        referralId: application.referralId,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Application submission failed:",
      error && error.code ? error.code : "unexpected error"
    );

    return res.status(500).json({
      message: "Unable to submit your application. Please try again.",
    });
  }
};

module.exports = {
  submitApplication,
};
