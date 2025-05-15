import User from "../models/user.model.js";

export const getUserByEmail = async (email) => {
  return await User.findOne({ email }).select("-password");
};

export const createUser = async (name, email, hashedPassword) => {
  return await User.create({
    name,
    email,
    password: hashedPassword,
  });
};

export const getUserWithpassword = async (email) => {
  return await User.findOne({ email }).select("+password");
};
