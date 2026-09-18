const Profile = require("../models/Profile");
const User = require("../models/user");

const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId }).lean();

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    const user = await User.findById(req.userId).select("name email").lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      profile: {
        ...profile,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const createProfile = async (req, res) => {
  try {
    const {
      designation,
      company,
      linkedinUrl = "",
      socialMediaUrl = "",
    } = req.body || {};

    if (!designation || !designation.trim() || !company || !company.trim()) {
      return res.status(400).json({
        message: "Designation and company are required",
      });
    }

    const existingProfile = await Profile.findOne({ userId: req.userId });

    if (existingProfile) {
      return res.status(409).json({
        message: "Profile already exists",
      });
    }

    const profile = await Profile.create({
      userId: req.userId,
      designation: designation.trim(),
      company: company.trim(),
      linkedinUrl: typeof linkedinUrl === "string" ? linkedinUrl.trim() : "",
      socialMediaUrl:
        typeof socialMediaUrl === "string" ? socialMediaUrl.trim() : "",
    });

    return res.status(201).json({
      message: "Profile created successfully",
      profile,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Profile already exists",
      });
    }

    console.error("Create profile error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {
      designation,
      company,
      linkedinUrl = "",
      socialMediaUrl = "",
    } = req.body || {};

    if (!designation || !designation.trim() || !company || !company.trim()) {
      return res.status(400).json({
        message: "Designation and company are required",
      });
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: req.userId },
      {
        designation: designation.trim(),
        company: company.trim(),
        linkedinUrl: typeof linkedinUrl === "string" ? linkedinUrl.trim() : "",
        socialMediaUrl:
          typeof socialMediaUrl === "string" ? socialMediaUrl.trim() : "",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getProfile,
  createProfile,
  updateProfile,
};
