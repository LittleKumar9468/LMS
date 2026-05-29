import mongoose from "mongoose";

// ================= TOPIC SCHEMA =================

const TopicSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
  },

  theoryText: {
    type: String,
    default: "",
  },

  allowPdfDownload: {
    type: Boolean,
    default: false,
  },

  test: {

    hasTest: {
      type: Boolean,
      default: false,
    },

    totalQuestions: {
      type: Number,
      default: 0,
    },

    optionsPerQuestion: {
      type: Number,
      default: 4,
    },

    durationMinutes: {
      type: Number,
      default: 0,
    },

    testDate: {
      type: String,
      default: "",
    },

    testStartTime: {
      type: String,
      default: "",
    },

    questions: {
      type: Array,
      default: [],
    },

  },

});

// ================= SUBJECT SCHEMA =================

const SubjectSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
  },

  // ✅ NOW SUBJECT BELONGS TO CATEGORY
  category: {

    type: mongoose.Schema.Types.ObjectId,

    ref: "Category",

    required: true,

  },

  topics: {
    type: [TopicSchema],
    default: [],
  },

});

// ================= MODEL =================

const Subject =
  mongoose.models.Subject ||
  mongoose.model("Subject", SubjectSchema);

export default Subject;