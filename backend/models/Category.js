import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  
course: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Course",
  required: true,
},
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Category =
  mongoose.models.Category ||
  mongoose.model("Category", CategorySchema);

export default Category;