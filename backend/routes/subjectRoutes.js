import express from "express";
import Subject from "../models/Subject.js";
import Category from "../models/Category.js";
import Course from "../models/Course.js";
import Progress from "../models/Progress.js";
import User from "../models/User.js";

const router = express.Router();

const normalizeText = (value = "") => value.trim().toLowerCase();

// ==========================================
// 📊 ADMIN ANALYTICS ENDPOINT
// ==========================================
router.get("/admin/students-analytics", async (req, res) => {
  try {
    const students = await User.find({}, { password: 0 });

    const completeAnalyticsData = await Promise.all(
      students.map(async (student) => {
        const studentProgress = await Progress.find({
          userId: student._id,
        });

        const detailedProgress = await Promise.all(
          studentProgress.map(async (p) => {
            const subjObj = await Subject.findById(p.subjectId).populate({
              path: "category",
              populate: {
                path: "course",
              },
            });

            return {
  subjectId: p.subjectId,
  subjectName: subjObj ? subjObj.name : "Unknown Subject",

  courseId:
    subjObj?.category?.course?._id || "",

  courseName:
    subjObj?.category?.course?.name || "General Track",

  category:
    subjObj?.category?.name || "N/A",

  progressPercentage: p.progressPercentage || 0,

  completedTopics: p.completedTopics || [],

  // IMPORTANT
  subjectTest: p.subjectTest || null,

  tests: p.tests || [],
};
          })
        );

        return {
          profile: student,
          analytics: detailedProgress,
        };
      })
    );

    res.json(completeAnalyticsData);
  } catch (error) {
    console.error("Error generating analytics:", error);
    res.status(500).json({
      message: "Server error while fetching analytics",
    });
  }
});

// ==========================================
// 🚀 DYNAMIC COURSE ENDPOINTS
// ==========================================

// GET ALL COURSES
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server error",
    });
  }
});

// ADD COURSE
router.post("/courses/add", async (req, res) => {
  const { name } = req.body;

  try {
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Course name is required",
      });
    }

    const normalizedName = normalizeText(name);

    const existingCourse = await Course.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
    });

    if (existingCourse) {
      return res.status(400).json({
        message: "Course already exists",
      });
    }

    const newCourse = new Course({
      name: name.trim(),
    });

    await newCourse.save();

    res.status(201).json({
      message: `Course "${name.trim()}" created!`,
      course: newCourse,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error creating course",
    });
  }
});

// DELETE COURSE + RELATED CATEGORIES + SUBJECTS + PROGRESS
router.delete("/courses/delete/:id", async (req, res) => {
  try {
    const courseId = req.params.id;

    const relatedCategories = await Category.find({
      course: courseId,
    });

    const categoryIds = relatedCategories.map((cat) => cat._id);

    const relatedSubjects = await Subject.find({
      category: { $in: categoryIds },
    });

    const subjectIds = relatedSubjects.map((sub) => sub._id);

    await Progress.deleteMany({
      subjectId: { $in: subjectIds },
    });

    await Subject.deleteMany({
      category: { $in: categoryIds },
    });

    await Category.deleteMany({
      course: courseId,
    });

    await Course.findByIdAndDelete(courseId);

    res.json({
      message: "Course and related data deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error deleting course",
    });
  }
});

// ==========================================
// 📚 SUBJECT MANAGEMENT
// ==========================================

// GET ALL SUBJECTS
router.get("/", async (req, res) => {
  try {
    const subjects = await Subject.find().populate({
      path: "category",
      populate: {
        path: "course",
      },
    });

    res.json(subjects);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching subjects",
    });
  }
});

// ADD SUBJECT
router.post("/add", async (req, res) => {
  const { name, categoryId, topics = [] } = req.body;

  try {
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Subject name is required",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        message: "Category is required",
      });
    }

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const duplicateSubject = await Subject.findOne({
      name: { $regex: new RegExp(`^${normalizeText(name)}$`, "i") },
      category: categoryId,
    });

    if (duplicateSubject) {
      return res.status(400).json({
        message: "Subject already exists in this category",
      });
    }

    const formattedTopics = topics
      .map((topic) => {
        const title =
          typeof topic === "string"
            ? topic.trim()
            : (topic?.title || "").trim();

        if (!title) return null;

        return {
          title,
          theoryText: "",
          allowPdfDownload: false,
          test: {
            hasTest: false,
            totalQuestions: 0,
            optionsPerQuestion: 4,
            durationMinutes: 10,
            testDate: "",
            testStartTime: "",
            questions: [],
          },
        };
      })
      .filter(Boolean);

    const uniqueTopics = [];
    const seenTopics = new Set();

    for (const topic of formattedTopics) {
      const key = normalizeText(topic.title);
      if (!seenTopics.has(key)) {
        seenTopics.add(key);
        uniqueTopics.push(topic);
      }
    }

    const newSubject = new Subject({
      name: name.trim(),
      category: categoryId,
      topics: uniqueTopics,
    });

    await newSubject.save();

    res.status(201).json({
      message: `Subject "${name.trim()}" created!`,
      subject: newSubject,
    });
  } catch (error) {
    console.log("Save Subject Error:", error);
    res.status(500).json({
      message: "Error creating subject",
    });
  }
});

// DELETE SUBJECT
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSubject = await Subject.findByIdAndDelete(id);

    if (!deletedSubject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    await Progress.deleteMany({
      subjectId: id,
    });

    res.json({
      message: "Subject and associated progress deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error deleting subject",
    });
  }
});

// ==========================================
// 📝 TOPIC CONTENT & TEST MANAGEMENT
// ==========================================

// ADD THEORY CONTENT
router.post("/add-content", async (req, res) => {
  const { subjectId, topicTitle, rawText, allowPdf } = req.body;

  try {
    const subject = await Subject.findById(subjectId);

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    const topic = subject.topics.find((t) => t.title === topicTitle);

    if (!topic) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }

    topic.theoryText = rawText;
    topic.allowPdfDownload = allowPdf;

    await subject.save();

    res.json({
      message: "Content updated",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error saving content",
    });
  }
});

// DELETE TOPIC
router.post("/delete-topic", async (req, res) => {
  const { subjectId, topicName } = req.body;

  try {
    const subject = await Subject.findById(subjectId);

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    subject.topics = subject.topics.filter((t) => t.title !== topicName);

    await subject.save();

    res.json({
      message: "Topic deleted",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error deleting topic",
    });
  }
});

// ADD TEST
router.post("/add-test", async (req, res) => {
  const {
    subjectId,
    topicTitle,
    totalQuestions,
    optionsPerQuestion,
    durationMinutes,
    testDate,
    testStartTime,
    questions,
  } = req.body;

  try {
    const subject = await Subject.findById(subjectId);

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    const topic = subject.topics.find((t) => t.title === topicTitle);

    if (!topic) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }

    topic.test = {
      hasTest: true,
      totalQuestions,
      optionsPerQuestion,
      durationMinutes,
      testDate,
      testStartTime,
      questions,
    };

    await subject.save();

    res.json({
      message: "Test saved successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error publishing test",
    });
  }
});

export default router;