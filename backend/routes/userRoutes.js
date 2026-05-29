import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

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

export default router;