const Offer = require("../models/Offer");
const StudentProfile = require("../models/StudentProfile");

const getMyOffers = async (req, res) => {
  try {
    // Find student profile
    const student = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    // Find student's offers
    const offers = await Offer.find({
      student: student._id,
    })
      .populate("company", "name logoUrl industry location")
      .populate("drive", "jobTitle package location")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: offers.length,
      offers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch offers",
      error: error.message,
    });
  }
};
const updateOfferStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["accepted", "declined"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid offer status",
      });
    }

    // Find offer
    const offer = await Offer.findById(req.params.offerId);

    if (!offer) {
      return res.status(404).json({
        message: "Offer not found",
      });
    }

    // Student can update only their own offer
    if (
      req.user.role === "student" &&
      offer.student.toString() !==
        (
          await StudentProfile.findOne({
            user: req.user.id,
          })
        )?._id.toString()
    ) {
      return res.status(403).json({
        message: "You can only update your own offer",
      });
    }

    // Offer can only be accepted/declined while active
    if (offer.status !== "active") {
      return res.status(400).json({
        message: `Offer is already ${offer.status}`,
      });
    }

    offer.status = status;

    await offer.save();

    return res.status(200).json({
      message: `Offer ${status} successfully`,
      offer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update offer status",
      error: error.message,
    });
  }
};

module.exports = {
  getMyOffers,
  updateOfferStatus,
};