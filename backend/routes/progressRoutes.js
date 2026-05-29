import express from "express";
import Progress from "../models/Progress.js";

const router = express.Router();

// SAVE PROGRESS
router.post("/save", async (req, res) => {
  try {
    const {
      userId,
      subjectId,
      topicName,
      totalTopics,
    } = req.body;

    // FIND EXISTING PROGRESS
    let progress = await Progress.findOne({
      userId,
      subjectId,
    });

    // IF EXISTS
    if (progress) {
      // CHECK TOPIC ALREADY COMPLETED
      const alreadyCompleted =
        progress.completedTopics.includes(
          topicName
        );

      // IF NOT COMPLETED
      if (!alreadyCompleted) {
        progress.completedTopics.push(
          topicName
        );

        // CALCULATE %
        progress.progressPercentage =
          (progress.completedTopics.length /
            totalTopics) * 100;

        await progress.save();
      }
    } else {
      // CREATE NEW PROGRESS
      progress = new Progress({
        userId,
        subjectId,

        completedTopics: [topicName],

        progressPercentage:
          (1 / totalTopics) * 100,
      });

      await progress.save();
    }

    res.status(200).json({
      message: "Progress Saved",
      progress,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
});

// SAVE TEST MARKS
router.post("/save-test", async (req, res) => {
  try {
    const {
      userId,
      subjectId,
      score,
      total,
      topicTitle,
      fullscreenExits,
      tabSwitches,
      warnings,
      durationSeconds,
      remainingSeconds,
    } = req.body;

    if (!userId || !subjectId) {
      return res.status(400).json({
        message: "userId and subjectId are required",
      });
    }

    // Pehle check karo ki kya student ka is subject ka progress exist karta hai
    let progress = await Progress.findOne({
      userId,
      subjectId,
    });

    const testPayload = {
      attempted: true,
      score: Number(score) || 0,
      total: Number(total) || 0,
      submittedAt: new Date(),
      topicTitle: topicTitle || "",
      fullscreenExits: Number(fullscreenExits) || 0,
      tabSwitches: Number(tabSwitches) || 0,
      warnings: Number(warnings) || 0,
      durationSeconds: Number(durationSeconds) || 0,
      remainingSeconds: Number(remainingSeconds) || 0,
    };

    if (progress) {
      // Agar progress already hai (yani usne topics padhe hain), toh sirf test marks update kar do
      progress.subjectTest = testPayload;

if (!progress.tests) {
  progress.tests = [];
}

progress.tests.push({
  topicTitle: topicTitle || "",
  attempted: true,
  score: Number(score) || 0,
  total: Number(total) || 0,
  percentage:
    Number(total) > 0
      ? Math.round((Number(score) / Number(total)) * 100)
      : 0,
  fullscreenExits: Number(fullscreenExits) || 0,
  tabSwitches: Number(tabSwitches) || 0,
  warnings: Number(warnings) || 0,
  submittedAt: new Date(),
});

await progress.save();
    } else {
      // Agar by chance student ne bina koi topic padhe direct test de diya, toh naya progress document banao
      progress = new Progress({
  userId,
  subjectId,

  subjectTest: testPayload,

  tests: [
    {
      topicTitle: topicTitle || "",
      attempted: true,
      score: Number(score) || 0,
      total: Number(total) || 0,
      percentage:
        Number(total) > 0
          ? Math.round((Number(score) / Number(total)) * 100)
          : 0,
      fullscreenExits: Number(fullscreenExits) || 0,
      tabSwitches: Number(tabSwitches) || 0,
      warnings: Number(warnings) || 0,
      submittedAt: new Date(),
    },
  ],
});

await progress.save();
    }

    res.status(200).json({
      success: true,
      message: "Test marks saved successfully!",
      progress,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error while saving test marks",
    });
  }
});

// GET USER PROGRESS
router.get("/:userId", async (req, res) => {
  try {
    const progress = await Progress.find({
      userId: req.params.userId,
    });

    res.json(progress);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
});

export default router;