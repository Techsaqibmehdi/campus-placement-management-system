const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const allowedMime = [
      "application/pdf",
      "application/x-pdf",
      "application/acrobat",
      "applications/vnd.pdf",
      "text/pdf",
      "application/octet-stream",
      "binary/octet-stream",
    ];

    if (ext === ".pdf" || allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files (.pdf) are allowed for resumes."));
    }
  },
});

module.exports = upload;