const express = require("express");

const { submitApplication } = require("../controller/applicationController");
const {
  getReferralApplications,
  getMyApplications,
  getApplicationResumeUrl,
  updateApplicationDecision,
} = require("../controller/applicationDashboardController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/my", authMiddleware, getMyApplications);
router.get("/referral/:referralId", authMiddleware, getReferralApplications);
router.get("/:applicationId/resume", authMiddleware, getApplicationResumeUrl);
router.patch("/:applicationId/decision", authMiddleware, updateApplicationDecision);
router.post("/", authMiddleware, submitApplication);

module.exports = router;
