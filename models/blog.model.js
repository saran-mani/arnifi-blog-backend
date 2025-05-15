import mongoose from "mongoose";
const blogSchema = new mongoose.Schema(
  {
    title: { type: String },
    category: { type: String },
    author: { type: String },
    content: { type: String },
    image: { type: String },
    userId: { type: mongoose.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;
