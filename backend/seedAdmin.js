import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected for Admin Seeding"))
  .catch((err) => console.log("Database connection error: ", err));

const seedAdmin = async () => {
  try {
    // Purane admin accounts ko clear karne ke liye
    await Admin.deleteMany();

    // Naya default admin create karein
    const adminData = {
      username: "Fuck", // Isko aap change kar sakte hain
      password: "543210" // Isko bhi aap change kar sakte hain
    };

    await Admin.create(adminData);
    console.log("✅ Admin account successfully created in database!");
    process.exit();
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();