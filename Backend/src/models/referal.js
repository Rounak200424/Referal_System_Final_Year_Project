const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    roleHiringFor: {
      type: String,
      required: true,
      trim: true,
    },

    jobLocation: {
      type: String,
      required: true,
      trim: true,
    },

    importantLink: {
      type: String,
      required: true,
      trim: true,
    },

    professionalCategory: {
      type: String,
      required: true,
      enum: [
        "IT / Software",
        "Finance",
        "HR",
        "Marketing",
        "Sales",
        "Operations",
        "Design",
        "Other",
      ],
    },

    opportunityCategory: {
      type: String,
      required: true,
      enum: [
        "Internship",
        "Entry Level",
        "Mid Level",
        "Senior Level",
      ],
    },

    jobDescription: {
      type: String,
      required: true,
      trim: true,
    },

    applicantLimit: {
      type: Number,
      required: true,
      min: 1,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Referral = mongoose.model("Referral", referralSchema);

module.exports = Referral;