const checkOneOfferPolicy = (student) => {
  if (student.hasOffer) {
    return false;
  }

  return true;
};

module.exports = {
  checkOneOfferPolicy,
};