const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized, token missing",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch live user to ensure fresh role and status
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        message: "User not found or account removed",
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({
        message: "Your account has been suspended by the placement cell.",
      });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      status: user.status || "active",
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, invalid token",
    });
  }
};

module.exports = protect;