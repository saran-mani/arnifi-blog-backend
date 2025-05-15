import express from "express";
import {
  createBlog,
  deleteBlog,
  editBlog,
  getAllBlogs,
  getMyBlogs,
} from "../controller/blog.controller.js";
import protect from "../middlewares/protect.js";
const router = express.Router();

router.use(protect); // Protect the routes from unautherized users
router.route("/").get(getAllBlogs).post(createBlog);
router.route("/my").get(getMyBlogs);
router.route("/:id").put(editBlog).delete(deleteBlog);

export default router;
