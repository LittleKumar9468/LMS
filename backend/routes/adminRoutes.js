import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const router = express.Router();

// ================= VERIFY ADMIN TOKEN (NEW FIX) =================
router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretKey");
    
    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({ message: "Invalid admin" });
    }

    res.status(200).json({ admin });
  } catch (error) {
    res.status(401).json({ message: "Token invalid or expired" });
  }
});

// @route   POST /api/admin/login
// @desc    Admin authentication & get token
router.post("/login", async (cmd, res) => {
  const { username, password } = cmd.body;

  try {
    // 1. Check if admin exists
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: "Invalid Admin ID or Password" });
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Admin ID or Password" });
    }

    // 3. Create and assign a JWT Token
    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET || "secretKey", // Fallback key
      { expiresIn: "1d" }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: "admin"
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;