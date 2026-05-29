import mongoose from "mongoose";

const ProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  completedTopics: [{ type: String }],
  progressPercentage: { type: Number, default: 0 },
  
  // NEW FIELDS FOR TEST SCORES
  subjectTest: {
    attempted: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    submittedAt: { type: Date }
  },
  tests: [{
  topicTitle: { type: String },
  attempted: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  fullscreenExits: { type: Number, default: 0 },
  tabSwitches: { type: Number, default: 0 },
  warnings: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
}],
  
  lastStudied: { type: Date, default: Date.now }
});

// Yahan yeh pattern use karein jo existing model ko check karega
const Progress = mongoose.models.Progress || mongoose.model("Progress", ProgressSchema);

export default Progress;