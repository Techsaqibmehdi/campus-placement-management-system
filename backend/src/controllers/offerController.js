const fs = require("fs");
const path = require("path");
const Offer = require("../models/Offer");
const StudentProfile = require("../models/StudentProfile");
const Company = require("../models/Company");
const { generateOfferLetterPDF } = require("../services/offerLetterGenerator");

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

const getRecruiterOffers = async (req, res) => {
  try {
    const company = await Company.findOne({
      recruiter: req.user.id,
    });

    if (!company) {
      return res.status(404).json({
        message: "No company assigned to this recruiter",
      });
    }

    const offers = await Offer.find({
      company: company._id,
    })
      .populate({
        path: "student",
        populate: {
          path: "user",
          select: "name email college rollNumber course branch",
        },
      })
      .populate("drive", "jobTitle package location employmentType")
      .populate("application", "status resume")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: offers.length,
      offers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch recruiter offers",
      error: error.message,
    });
  }
};

const updateOfferStatus = async (req, res) => {
  try {
    let { status } = req.body;
    if (status === "rejected") status = "declined";

    const allowedStatuses = ["accepted", "declined"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid offer status. Must be 'accepted' or 'declined'",
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

const getOfferLetterPdf = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId)
      .populate({
        path: "student",
        populate: { path: "user", select: "name email rollNumber course branch college" },
      })
      .populate("company", "name location website")
      .populate("drive", "jobTitle package baseSalary variableSalary location");

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Authorization check: Student (owner), Recruiter (company owner), or Admin
    if (req.user.role === "student") {
      const studentProfile = await StudentProfile.findOne({ user: req.user.id });
      if (!studentProfile || offer.student._id.toString() !== studentProfile._id.toString()) {
        return res.status(403).json({ message: "You are not authorized to view this offer letter" });
      }
    } else if (req.user.role === "recruiter") {
      const company = await Company.findOne({ recruiter: req.user.id });
      if (!company || offer.company._id.toString() !== company._id.toString()) {
        return res.status(403).json({ message: "You are not authorized to view this offer letter" });
      }
    }

    // Check if offerLetterUrl already points to a valid local file
    if (offer.offerLetterUrl && offer.offerLetterUrl.startsWith("/uploads/")) {
      const localFilePath = path.join(__dirname, "../../", offer.offerLetterUrl);
      if (fs.existsSync(localFilePath)) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="Offer_Letter_${(offer.student?.user?.name || "Student").replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`
        );
        return fs.createReadStream(localFilePath).pipe(res);
      }
    }

    // If file doesn't exist yet on disk or was created previously without PDF, dynamically generate it now!
    const genResult = await generateOfferLetterPDF({
      student: {
        name: offer.student?.user?.name || "Selected Candidate",
        rollNumber: offer.student?.user?.rollNumber || offer.student?.rollNumber || "N/A",
        course: offer.student?.user?.course || offer.student?.course || "B.Tech",
        branch: offer.student?.user?.branch || offer.student?.branch || "Computer Science and Engineering",
        college: offer.student?.user?.college || "XYZ Group of Institutions",
        email: offer.student?.user?.email || "",
      },
      company: {
        name: offer.company?.name || "Corporate Partner",
        location: offer.company?.location || "Delhi-NCR",
        website: offer.company?.website || "",
      },
      drive: {
        jobTitle: offer.jobTitle || offer.drive?.jobTitle || "Role",
        package: offer.package || offer.drive?.package || 0,
        baseSalary: offer.baseSalary || offer.drive?.baseSalary,
        variableSalary: offer.variableSalary || offer.drive?.variableSalary,
        location: offer.drive?.location || "Delhi-NCR",
      },
      offer: {
        _id: offer._id,
        joiningDate: offer.joiningDate,
        offerDate: offer.offerDate || offer.createdAt,
        package: offer.package,
        baseSalary: offer.baseSalary,
        variableSalary: offer.variableSalary,
      },
    });

    // Update offer document with the generated PDF path
    offer.offerLetterUrl = genResult.relativeUrl;
    await offer.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Offer_Letter_${(offer.student?.user?.name || "Student").replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`
    );
    return fs.createReadStream(genResult.filePath).pipe(res);
  } catch (error) {
    console.error("Error retrieving offer letter PDF:", error);
    return res.status(500).json({ message: "Failed to load offer letter PDF", error: error.message });
  }
};

module.exports = {
  getMyOffers,
  getRecruiterOffers,
  updateOfferStatus,
  getOfferLetterPdf,
};