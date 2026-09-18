const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      college,
      course,
      branch,
      rollNumber,
    } = req.body;

    // Required fields validation
    if (
      !name ||
      !email ||
      !password ||
      !college ||
      !course ||
      !branch ||
      !rollNumber
    ) {
      return res.status(400).json({
        message: "All registration fields are required",
      });
    }

    // College validation
    if (college !== "KIET Group of Institutions") {
      return res.status(400).json({
        message: "Invalid college",
      });
    }

    // Course validation
    const allowedCourses = [
      "BCA",
      "MCA",
      "B.Tech",
      "M.Tech",
      "MBA",
    ];

    if (!allowedCourses.includes(course)) {
      return res.status(400).json({
        message: "Invalid course",
      });
    }

    // Email check
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Roll number check
    const existingRollNumber = await User.findOne({
      rollNumber,
    });

    if (existingRollNumber) {
      return res.status(400).json({
        message: "Roll number already registered",
      });
    }

    // Password hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Student account creation
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "student",
      college: "KIET Group of Institutions",
      course,
      branch,
      rollNumber,
    });

    res.status(201).json({
      message: "Student registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        course: user.course,
        branch: user.branch,
        rollNumber: user.rollNumber,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};


module.exports = { registerUser, loginUser };