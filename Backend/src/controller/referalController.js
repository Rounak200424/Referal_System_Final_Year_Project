const Referral = require("../models/referal");

const createReferral = async (req, res) => {
  try {
    const {
      companyName,
      roleHiringFor,
      jobLocation,
      importantLink,
      professionalCategory,
      opportunityCategory,
      jobDescription,
      applicantLimit,
    } = req.body || {};

    // Check required fields
    if (
      !companyName ||
      !roleHiringFor ||
      !jobLocation ||
      !importantLink ||
      !professionalCategory ||
      !opportunityCategory ||
      !jobDescription ||
      !applicantLimit
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Create referral
    const referral = await Referral.create({
      companyName,
      roleHiringFor,
      jobLocation,
      importantLink,
      professionalCategory,
      opportunityCategory,
      jobDescription,
      applicantLimit,
      createdBy: req.userId,
    });

    return res.status(201).json({
      message: "Referral created successfully",
      referral,
    });
  } catch (error) {
    console.error("Create referral error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createReferral,
};