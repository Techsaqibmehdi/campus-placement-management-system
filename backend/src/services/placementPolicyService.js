const Offer = require("../models/Offer");

const getDriveCategory = (drive) => {
  if (drive?.category) {
    const cat = String(drive.category).trim();
    if (cat.toLowerCase().includes("super")) return "Super Dream";
    if (cat.toLowerCase().includes("dream")) return "Dream";
    return "Regular";
  }
  const pkg = Number(drive?.package) || 0;
  if (pkg >= 10) return "Super Dream";
  if (pkg >= 6) return "Dream";
  return "Regular";
};

const checkOneOfferPolicy = async (studentId, targetDrive = null) => {
  const existingOffer = await Offer.findOne({
    student: studentId,
    status: {
      $in: ["active", "accepted"],
    },
  }).sort({ package: -1 });

  const driveCategory = targetDrive ? getDriveCategory(targetDrive) : "Regular";

  if (!existingOffer) {
    return {
      canApply: true,
      hasOffer: false,
      existingOffer: null,
      category: driveCategory,
      isUpgrade: false,
      message: "Eligible to apply",
    };
  }

  // Student already holds an offer:
  // Dream (6-9.99 LPA) and Super Dream (>= 10 LPA) are exempt from One Offer Policy!
  if (driveCategory === "Dream" || driveCategory === "Super Dream") {
    return {
      canApply: true,
      hasOffer: true,
      existingOffer,
      category: driveCategory,
      isUpgrade: true,
      message: `Eligible to apply: One offer policy does not restrict ${driveCategory} drives.`,
    };
  }

  // Regular drives (< 6 LPA) are blocked for students who already hold an offer
  return {
    canApply: false,
    hasOffer: true,
    existingOffer,
    category: driveCategory,
    isUpgrade: false,
    message:
      "Under the college placement policy, students with an active or accepted offer cannot apply for Regular drives (< 6 LPA). You are eligible to apply for Dream (≥ 6 LPA) and Super Dream (≥ 10 LPA) drives.",
  };
};

module.exports = {
  getDriveCategory,
  checkOneOfferPolicy,
};