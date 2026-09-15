const express = require("express");

const {
  createReferral,
} = require("../controller/referalController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createReferral);

module.exports = router;