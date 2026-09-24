const express = require("express");

const {
  getReferrals,
  createReferral,
} = require("../controller/referalController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getReferrals);
router.post("/", authMiddleware, createReferral);

module.exports = router;