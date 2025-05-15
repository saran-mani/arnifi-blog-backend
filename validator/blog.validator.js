import { body } from "express-validator";

export const createBlogValidator = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters long"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn(["Career", "Finance", "Travel"])
    .withMessage("Category must be one of: Career, Finance, Travel"),

  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ min: 20 })
    .withMessage("Content must be at least 20 characters"),

  body("image").optional().isURL().withMessage("Image must be a valid URL"),
];
