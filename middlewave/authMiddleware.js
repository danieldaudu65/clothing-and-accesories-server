const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");

const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ✅ Check if header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, msg: "No token provided" });
    }

    // ✅ Extract token from header
    const token = authHeader.split(" ")[1];

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Find admin in DB
    const admin = await Admin.findById(decoded._id);
    if (!admin) {
      return res.status(401).json({ success: false, msg: "Invalid admin token" });
    }

    // ✅ Attach admin to request for use later
    req.admin = admin;
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).json({ success: false, msg: "Unauthorized access" });
  }
};

module.exports = verifyAdmin;
