const express = require("express");

const { submitApplication } = require("../controller/applicationController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, submitApplication);

module.exports = router;
