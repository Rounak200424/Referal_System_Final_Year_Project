const express = require("express");

const {
  getProfile,
  createProfile,
  updateProfile,
} = require("../controller/profileController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getProfile);
router.post("/", authMiddleware, createProfile);
router.put("/", authMiddleware, updateProfile);

module.exports = router;
