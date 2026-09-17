const Offer = require("../models/Offer");

const checkOneOfferPolicy = async (studentId) => {
  const existingOffer = await Offer.findOne({
    student: studentId,
    status: {
      $in: ["active", "accepted"],
    },
  });

  return !existingOffer;
};

module.exports = {
  checkOneOfferPolicy,
};