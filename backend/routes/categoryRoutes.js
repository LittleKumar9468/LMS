import express from "express";

import Category from "../models/Category.js";
import Subject from "../models/Subject.js";
import Progress from "../models/Progress.js";

const router = express.Router();


// ==========================================
// GET ALL CATEGORIES
// ==========================================
router.get("/", async (req, res) => {

  try {

    const categories = await Category.find()
      .populate("course");

    res.json(categories);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error fetching categories",
    });

  }

});


// ==========================================
// ADD CATEGORY
// ==========================================
// ==========================================
// ADD CATEGORY (FIXED)
// ==========================================
router.post("/add", async (req, res) => {
  const { name, courseId } = req.body;

  try {
    const existingCategory = await Category.findOne({
      name,
      course: courseId,
    });

    if (existingCategory) {
      return res.status(400).json({
        message: "Category already exists in this course",
      });
    }

    const newCategory = new Category({
      name,
      course: courseId,
    });

    await newCategory.save();

    // CRITICAL FIX: Populate the course relationship before returning it 
    // so the frontend immediately receives access to `cat.course.name`
    const populatedCategory = await Category.findById(newCategory._id).populate("course");

    // Return the object directly
    res.status(201).json(populatedCategory);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error creating category",
    });
  }
});

// ==========================================
// DELETE CATEGORY + RELATED SUBJECTS
// ==========================================
router.delete("/delete/:id", async (req, res) => {

  try {

    const categoryId = req.params.id;

    // Find related subjects
    const relatedSubjects =
      await Subject.find({
        category: categoryId,
      });

    // Extract subject IDs
    const subjectIds =
      relatedSubjects.map(
        (sub) => sub._id
      );

    // Delete related progress
    await Progress.deleteMany({
      subjectId: {
        $in: subjectIds,
      },
    });

    // Delete related subjects
    await Subject.deleteMany({
      category: categoryId,
    });

    // Delete category
    await Category.findByIdAndDelete(
      categoryId
    );

    res.json({
      message:
        "Category and related subjects deleted successfully",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message:
        "Error deleting category",
    });

  }

});

export default router;