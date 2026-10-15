const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral",
      required: true,
    },

    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    resumePath: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value) => !/^https?:\/\//i.test(value),
        message: "resumePath must be a private storage path, not a URL.",
      },
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      required: true,
    },

    decisionMessage: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index(
  { referralId: 1, applicantId: 1 },
  { unique: true }
);

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
