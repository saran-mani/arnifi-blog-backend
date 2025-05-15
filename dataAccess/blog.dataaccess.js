import { APIFeatures } from "../helpers/apiFeatures.js";
import Blog from "../models/blog.model.js";

export const getAllBlogsDA = async (query) => {
  const features = new APIFeatures(Blog.find(), query, false)
    .filter()
    .search()
    .sort()
    .limitFields();

  const result = await features.paginate(Blog);
  return result;
};

export const getMyBlogsDA = async (userId, query) => {
  const features = new APIFeatures(Blog.find({ userId }), query, false)
    .filter()
    .search()
    .sort()
    .limitFields();

  const result = await features.paginate(Blog);
  return result;
};

export const createNewBlog = async (title, category, content, image, user) => {
  const blog = new Blog({
    title: title,
    category: category,
    content: content,
    image: image,
    author: user.name,
    userId: user._id,
  });

  return await blog.save();
};
