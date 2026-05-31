import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  username: {
    type: String,
    required: true,
    unique: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  phone: {
    type: String,
    required: true,
  },

  dob: {
    type: String,
    required: true,
  },

  gender: {
    type: String,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },
  resetPasswordToken: {
  type: String,
},

resetPasswordExpire: {
  type: Date,
},

  interestedCourses: {
    type: [String],
    default: [],
  },

  role: {
    type: String,
    default: "student",
  },
});

const User = mongoose.model("User", userSchema);

export default User;