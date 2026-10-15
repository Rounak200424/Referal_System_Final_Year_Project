const Referral = require("../models/referal");
const Application = require("../models/Application");
const Profile = require("../models/Profile");

const getMyReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find({ createdBy: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    if (referrals.length === 0) {
      return res.status(200).json({ referrals: [] });
    }

    const counts = await Application.aggregate([
      {
        $match: {
          referralId: { $in: referrals.map((referral) => referral._id) },
        },
      },
      {
        $group: {
          _id: "$referralId",
          applicantCount: { $sum: 1 },
        },
      },
    ]);
    const countsByReferralId = new Map(
      counts.map((item) => [String(item._id), item.applicantCount])
    );

    return res.status(200).json({
      referrals: referrals.map((referral) => {
        const applicantCount =
          countsByReferralId.get(String(referral._id)) || 0;
        return {
          ...referral,
          applicantCount,
          remainingSlots: Math.max(0, referral.applicantLimit - applicantCount),
          applicationsClosed: applicantCount >= referral.applicantLimit,
        };
      }),
    });
  } catch (error) {
    console.error("Get my referrals error:", error.code || "unexpected error");
    return res.status(500).json({
      message: "Unable to load your referrals.",
    });
  }
};

const getReferrals = async (req, res) => {
  try {
    const filters = {};
    const { jobLocation, professionalCategory, opportunityCategory } = req.query;

    if (jobLocation && jobLocation.trim()) {
      filters.jobLocation = jobLocation.trim();
    }

    if (professionalCategory && professionalCategory.trim()) {
      filters.professionalCategory = professionalCategory.trim();
    }

    if (opportunityCategory && opportunityCategory.trim()) {
      filters.opportunityCategory = opportunityCategory.trim();
    }

    const referrals = await Referral.find(filters)
      .populate("createdBy", "name profilePhoto")
      .select("+applicationsCount")
      .sort({ createdAt: -1 })
      .lean();

    const creatorIds = referrals
      .filter((referral) => referral.createdBy)
      .map((referral) => referral.createdBy._id);
    const profiles = await Profile.find({ userId: { $in: creatorIds } })
      .select("userId designation company linkedinUrl socialMediaUrl")
      .lean();
    const profilesByUserId = new Map(
      profiles.map((profile) => [String(profile.userId), profile])
    );

    const referralsWithProfiles = referrals.map((referral) => {
      if (!referral.createdBy) return referral;

      const profile = profilesByUserId.get(String(referral.createdBy._id));
      return {
        ...referral,
        createdBy: {
          _id: referral.createdBy._id,
          name: referral.createdBy.name,
          profile: profile
            ? {
                designation: profile.designation,
                company: profile.company,
                linkedinUrl: profile.linkedinUrl,
                socialMediaUrl: profile.socialMediaUrl,
                profilePictureUrl: referral.createdBy.profilePhoto || null,
              }
            : null,
        },
      };
    });

    return res.status(200).json({
      referrals: referralsWithProfiles,
    });
  } catch (error) {
    console.error("Get referrals error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

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
  getMyReferrals,
  getReferrals,
  createReferral,
};