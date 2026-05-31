import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User.js";
import transporter from "../config/mail.js";

const router = express.Router();

// ================= VERIFY TOKEN (NEW FIX) =================
router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select("-password").populate("interestedCourses");
    if (!user) {
      return res.status(401).json({ message: "Invalid user" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(401).json({ message: "Token invalid or expired" });
  }
});

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      phone,
      dob,
      gender,
      password,
      interestedCourses = [],
    } = req.body;

    // CHECK EXISTING USERNAME
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // CHECK EXISTING EMAIL
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // CREATE USER
    const newUser = new User({
      name,
      username,
      email,
      phone,
      dob,
      gender,
      password: hashedPassword,
      interestedCourses,
    });

    await newUser.save();

    res.status(201).json({
      message: "User Registered Successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        interestedCourses: newUser.interestedCourses,
      },
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // FIND USER
    const user = await User.findOne({ username }).populate("interestedCourses");
    if (!user) {
      return res.status(400).json({ message: "Invalid Username" });
    }

    // CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    // CREATE TOKEN
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // RESPONSE
    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        interestedCourses: user.interestedCourses || [],
      },
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});
// ================= FORGOT PASSWORD =================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Email not found",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetUrl =
      `https://lms-seven-azure.vercel.app/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "LMS Password Reset",
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password.</p>

        <a href="${resetUrl}"
           style="
             background:#2563eb;
             color:white;
             padding:10px 20px;
             text-decoration:none;
             border-radius:5px;
           ">
          Reset Password
        </a>

        <p>This link expires in 10 minutes.</p>
      `,
    });

    res.status(200).json({
      message: "Reset link sent to email",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});
// ================= RESET PASSWORD =================
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});
export default router;