import { matchedData, validationResult } from "express-validator";
import {
  createNewBlog,
  getAllBlogsDA,
  getMyBlogsDA,
} from "../dataAccess/blog.dataaccess.js";
import Blog from "../models/blog.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import { createBlogValidator } from "../validator/blog.validator.js";
import AppError from "../utils/appError.js";

// Get All Blogs
export const getAllBlogs = catchAsync(async (req, res, next) => {
  const result = await getAllBlogsDA(req.query);

  res.status(200).json({
    status: "success",
    data: result.data,
    totalDocuments: result.totalDocuments,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    limit: result.limit,
    hasNextPage: result.hasNextPage,
    hasPreviousPage: result.hasPreviousPage,
  });
});

// Get user specific blogs (Blogs created By the user)
export const getMyBlogs = catchAsync(async (req, res, next) => {
  const result = await getMyBlogsDA(req.user._id, req.query);

  res.status(200).json({
    status: "success",
    data: result.data,
    totalDocuments: result.totalDocuments,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    limit: result.limit,
    hasNextPage: result.hasNextPage,
    hasPreviousPage: result.hasPreviousPage,
  });
});

// Create Blog (only authorised user can create blog)
export const createBlog = catchAsync(async (req, res, next) => {
  await Promise.all(createBlogValidator.map((validator) => validator.run(req)));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array().at(0)?.msg, 400));
  }

  const { title, category, content, image } = matchedData(req);

  const blog = await createNewBlog(title, category, content, image, req.user);

  res.status(201).json({
    status: "success",
    data: {
      blog,
    },
  });
});

// Edit Blog (Edit Blog can be done only by the user that created the blog)
export const editBlog = catchAsync(async (req, res, next) => {
  const blogId = req.params.id;

  const blog = await Blog.findById(blogId);

  if (!blog) {
    return next(new AppError("Blog not found", 404));
  }
  if (blog.userId.toString() !== req.user._id.toString()) {
    return next(new AppError("You are not authorized to edit this blog", 403));
  }

  blog.title = req.body.title || blog.title;
  blog.category = req.body.category || blog.category;
  blog.content = req.body.content || blog.content;

  await blog.save();

  res.status(200).json({
    status: "success",
    data: blog,
  });
});

// Delete Blog (Delete blog can be done only by the user that created the blog)
export const deleteBlog = catchAsync(async (req, res, next) => {
  const blogId = req.params.id;

  const blog = await Blog.findById(blogId);

  if (!blog) {
    return next(new AppError("Blog not found", 404));
  }

  if (blog.userId.toString() !== req.user._id.toString()) {
    return next(
      new AppError("You are not authorized to delete this blog", 403)
    );
  }

  await Blog.deleteOne({ _id: blogId });

  res.status(204).json({
    status: "success",
    data: null,
  });
});
