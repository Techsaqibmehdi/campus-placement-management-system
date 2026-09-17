const StudentProfile = require("../models/StudentProfile");
const Application = require("../models/Application");
const Interview = require("../models/Interview");
const Offer = require("../models/Offer");
const Company = require("../models/Company");
const PlacementDrive = require("../models/PlacementDrive");

const getPlacementAnalytics = async (req, res) => {
  try {
    const [
      totalStudents,
      totalCompanies,
      totalDrives,
      totalApplications,
      totalShortlisted,
      totalInterviews,
      totalOffers,
      placedStudents,
      packageStats,
    ] = await Promise.all([
      StudentProfile.countDocuments(),

      Company.countDocuments(),

      PlacementDrive.countDocuments(),

      Application.countDocuments(),

      Application.countDocuments({
        status: "shortlisted",
      }),

      Interview.countDocuments(),

      Offer.countDocuments(),

      Offer.aggregate([
        {
          $match: {
            status: {
              $in: ["active", "accepted"],
            },
          },
        },
        {
          $group: {
            _id: "$student",
          },
        },
        {
          $count: "total",
        },
      ]),

      Offer.aggregate([
        {
          $match: {
            status: {
              $in: ["active", "accepted"],
            },
          },
        },
        {
          $group: {
            _id: null,
            highestPackage: {
              $max: "$package",
            },
            averagePackage: {
              $avg: "$package",
            },
          },
        },
      ]),
    ]);

    const placedStudentCount =
      placedStudents.length > 0
        ? placedStudents[0].total
        : 0;

        const branchStats = await Offer.aggregate([
  {
    $match: {
      status: {
        $in: ["active", "accepted"],
      },
    },
  },
  {
    $lookup: {
      from: "studentprofiles",
      localField: "student",
      foreignField: "_id",
      as: "student",
    },
  },
  {
    $unwind: "$student",
  },
  {
    $group: {
      _id: "$student.branch",
      placedStudents: {
        $addToSet: "$student._id",
      },
      averagePackage: {
        $avg: "$package",
      },
      highestPackage: {
        $max: "$package",
      },
    },
  },
  {
    $project: {
      _id: 0,
      branch: "$_id",
      placedStudents: {
        $size: "$placedStudents",
      },
      averagePackage: {
        $round: ["$averagePackage", 2],
      },
      highestPackage: 1,
    },
  },
  {
    $sort: {
      branch: 1,
    },
  },
]);

const companyStats = await Offer.aggregate([
  {
    $match: {
      status: { $in: ["active", "accepted"] },
    },
  },
  {
    $lookup: {
      from: "companies",
      localField: "company",
      foreignField: "_id",
      as: "company",
    },
  },
  {
    $unwind: "$company",
  },
  {
    $group: {
      _id: "$company._id",
      company: {
        $first: "$company.name",
      },
      placedStudents: {
        $addToSet: "$student",
      },
      averagePackage: {
        $avg: "$package",
      },
      highestPackage: {
        $max: "$package",
      },
    },
  },
  {
    $project: {
      _id: 0,
      company: 1,
      placedStudents: {
        $size: "$placedStudents",
      },
      averagePackage: {
        $round: ["$averagePackage", 2],
      },
      highestPackage: 1,
    },
  },
  {
    $sort: {
      company: 1,
    },
  },
]);

    const placementRate =
      totalStudents > 0
        ? ((placedStudentCount / totalStudents) * 100).toFixed(2)
        : "0.00";

    const highestPackage =
      packageStats.length > 0
        ? packageStats[0].highestPackage
        : 0;

    const averagePackage =
      packageStats.length > 0
        ? Number(packageStats[0].averagePackage.toFixed(2))
        : 0;

    return res.status(200).json({
      totalStudents,
      totalCompanies,
      totalDrives,
      totalApplications,
      totalShortlisted,
      totalInterviews,
      totalOffers,
      placedStudents: placedStudentCount,
      placementRate: `${placementRate}%`,
      highestPackage,
      averagePackage,
      branchStats,
      companyStats,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch placement analytics",
      error: error.message,
    });
  }
};

module.exports = {
  getPlacementAnalytics,
};