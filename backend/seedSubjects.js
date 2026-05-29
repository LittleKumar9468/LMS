import mongoose from "mongoose";
import dotenv from "dotenv";

import Subject from "./models/Subject.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB Connected");
})
.catch((error) => {
  console.log(error);
});

const subjects = [

  // Placement Subjects

  {
    name: "DSA",
    category: "Placement",
  },

  {
    name: "DBMS",
    category: "Placement",
  },

  {
    name: "Computer Network",
    category: "Placement",
  },

  {
    name: "Operating System",
    category: "Placement",
  },

  {
    name: "Oops Concepts",
    category: "Placement",
  },

  // Semester Subjects

  {
    name: "Numerical Methods",
    category: "Semester",
  },

  {
    name: "Cloud Computing",
    category: "Semester",
  },

  {
    name: "Microcontroller",
    category: "Semester",
  },

  {
    name: "Aptitude",
    category: "Semester",
  },

  {
    name: "Soft Skill",
    category: "Semester",
  },

];

const insertSubjects = async () => {

  try {

    await Subject.deleteMany();

    await Subject.insertMany(subjects);

    console.log("Subjects Inserted");

    process.exit();

  } catch (error) {

    console.log(error);

    process.exit();

  }

};

insertSubjects();