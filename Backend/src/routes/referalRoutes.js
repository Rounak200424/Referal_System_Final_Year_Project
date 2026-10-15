const express = require("express");

const {
  getMyReferrals,
  getReferrals,
  createReferral,
} = require("../controller/referalController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/my", authMiddleware, getMyReferrals);
router.get("/", getReferrals);
router.post("/", authMiddleware, createReferral);

module.exports = router;