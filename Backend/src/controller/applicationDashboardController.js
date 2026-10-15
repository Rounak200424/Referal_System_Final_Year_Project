const mongoose = require("mongoose");
const Application = require("../models/Application");
const Referral = require("../models/referal");
const { supabase, bucketName } = require("../config/supabase");

const APPLICATION_STATUS_ORDER = {
  APPROVED: 0,
  PENDING: 1,
  REJECTED: 2,
};
const SIGNED_URL_TTL_SECONDS = 60;

const isValidId = (value) =>
  typeof value === "string" && mongoose.isObjectIdOrHexString(value);

const getReferralApplications = async (req, res) => {
  const { referralId } = req.params;
  if (!isValidId(referralId)) {
    return res.status(400).json({ message: "Invalid referral ID." });
  }

  try {
    const referral = await Referral.findById(referralId).select("_id createdBy");
    if (!referral) {
      return res.status(404).json({ message: "Referral not found." });
    }
    if (String(referral.createdBy) !== String(req.userId)) {
      return res.status(403).json({
        message: "You are not allowed to view applicants for this referral.",
      });
    }

    const applications = await Application.find({ referralId: referral._id })
      .populate("applicantId", "name email")
      .select("_id applicantId status decisionMessage createdAt")
      .lean();

    applications.sort((left, right) => {
      const statusDifference =
        (APPLICATION_STATUS_ORDER[left.status] ?? Number.MAX_SAFE_INTEGER) -
        (APPLICATION_STATUS_ORDER[right.status] ?? Number.MAX_SAFE_INTEGER);
      if (statusDifference !== 0) return statusDifference;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

    return res.status(200).json({
      applications: applications.map((application) => ({
        applicationId: application._id,
        applicant: application.applicantId
          ? {
              applicantId: application.applicantId._id,
              fullName: application.applicantId.name,
              email: application.applicantId.email,
            }
          : null,
        status: application.status,
        applicationDate: application.createdAt,
        decisionMessage: application.decisionMessage || "",
      })),
    });
  } catch (error) {
    console.error(
      "Get referral applications error:",
      error.code || "unexpected error"
    );
    return res.status(500).json({
      message: "Unable to load applicants for this referral.",
    });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicantId: req.userId })
      .populate(
        "referralId",
        "companyName roleHiringFor jobLocation professionalCategory opportunityCategory createdAt"
      )
      .select("_id referralId status decisionMessage createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      applications: applications.map((application) => ({
        applicationId: application._id,
        status: application.status,
        decisionMessage: application.decisionMessage || "",
        applicationDate: application.createdAt,
        updatedAt: application.updatedAt,
        referral: application.referralId
          ? {
              referralId: application.referralId._id,
              companyName: application.referralId.companyName,
              roleHiringFor: application.referralId.roleHiringFor,
              jobLocation: application.referralId.jobLocation,
              professionalCategory:
                application.referralId.professionalCategory,
              opportunityCategory:
                application.referralId.opportunityCategory,
              createdAt: application.referralId.createdAt,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Get my applications error:", error.code || "unexpected error");
    return res.status(500).json({
      message: "Unable to load your applications.",
    });
  }
};

const getApplicationResumeUrl = async (req, res) => {
  const { applicationId } = req.params;
  if (!isValidId(applicationId)) {
    return res.status(400).json({ message: "Invalid application ID." });
  }

  try {
    const application = await Application.findById(applicationId)
      .select("referralId resumePath")
      .lean();
    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    const referral = await Referral.findById(application.referralId).select(
      "_id createdBy"
    );
    if (!referral) {
      return res.status(404).json({ message: "Referral not found." });
    }
    if (String(referral.createdBy) !== String(req.userId)) {
      return res.status(403).json({
        message: "You are not allowed to access this resume.",
      });
    }
    if (!bucketName) {
      console.error("Resume access failed: SUPABASE_BUCKET is not configured.");
      return res.status(500).json({
        message: "Resume storage is not configured.",
      });
    }

    const download = req.query.download === "true";
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(application.resumePath, SIGNED_URL_TTL_SECONDS, {
        download: download ? true : false,
      });

    if (error || !data || !data.signedUrl) {
      if (
        error &&
        (String(error.statusCode) === "404" ||
          /not found/i.test(error.message || ""))
      ) {
        return res.status(404).json({ message: "Resume file not found." });
      }
      console.error(
        "Resume signed URL creation failed:",
        (error && error.statusCode) || "unknown"
      );
      return res.status(502).json({
        message: "Unable to access this resume right now.",
      });
    }

    return res.status(200).json({
      signedUrl: data.signedUrl,
      expiresIn: SIGNED_URL_TTL_SECONDS,
    });
  } catch (error) {
    console.error(
      "Resume access failed:",
      error.code || "unexpected error"
    );
    return res.status(500).json({
      message: "Unable to access this resume right now.",
    });
  }
};

const updateApplicationDecision = async (req, res) => {
  const { applicationId } = req.params;
  const { status, message } = req.body || {};

  if (!isValidId(applicationId)) {
    return res.status(400).json({ message: "Invalid application ID." });
  }
  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({
      message: "status must be APPROVED or REJECTED.",
    });
  }
  if (message !== undefined && typeof message !== "string") {
    return res.status(400).json({
      message: "Decision message must be text.",
    });
  }
  const decisionMessage = typeof message === "string" ? message.trim() : "";
  if (decisionMessage.length > 1000) {
    return res.status(400).json({
      message: "Decision message must be 1000 characters or fewer.",
    });
  }

  try {
    const application = await Application.findById(applicationId)
      .select("_id referralId applicantId status")
      .lean();
    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    const referral = await Referral.findById(application.referralId).select(
      "_id createdBy"
    );
    if (!referral) {
      return res.status(404).json({ message: "Referral not found." });
    }
    if (String(referral.createdBy) !== String(req.userId)) {
      return res.status(403).json({
        message: "You are not allowed to decide on this application.",
      });
    }

    const updatedApplication = await Application.findOneAndUpdate(
      { _id: application._id, status: "PENDING" },
      {
        $set: {
          status,
          decisionMessage,
        },
      },
      { new: true, runValidators: true }
    )
      .populate("applicantId", "name email")
      .select("_id applicantId status decisionMessage createdAt updatedAt")
      .lean();

    if (!updatedApplication) {
      return res.status(409).json({
        message: "This application has already been decided. Reload the applicants and try again.",
      });
    }

    return res.status(200).json({
      message: "Application decision saved.",
      application: {
        applicationId: updatedApplication._id,
        applicant: updatedApplication.applicantId
          ? {
              applicantId: updatedApplication.applicantId._id,
              fullName: updatedApplication.applicantId.name,
              email: updatedApplication.applicantId.email,
            }
          : null,
        status: updatedApplication.status,
        applicationDate: updatedApplication.createdAt,
        updatedAt: updatedApplication.updatedAt,
        decisionMessage: updatedApplication.decisionMessage || "",
      },
    });
  } catch (error) {
    console.error(
      "Update application decision error:",
      error.code || "unexpected error"
    );
    return res.status(500).json({
      message: "Unable to save the application decision.",
    });
  }
};

module.exports = {
  getReferralApplications,
  getMyApplications,
  getApplicationResumeUrl,
  updateApplicationDecision,
};
