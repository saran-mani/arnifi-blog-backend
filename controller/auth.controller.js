import bcrypt from "bcryptjs";
import { matchedData, validationResult } from "express-validator";
import AppError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { userSignupValidator } from "../validator/user.signup.validator.js";
import {
  createUser,
  getUserByEmail,
  getUserWithpassword,
} from "../dataAccess/user.dataaccess.js";
import userSigninValidator from "../validator/user.signin.validator.js";
import jwt from "jsonwebtoken";

// User signup controller
export const signup = catchAsync(async (req, res, next) => {
  await Promise.all(userSignupValidator.map((validator) => validator.run(req)));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(`${errors.array().at(0)?.msg}`, 400));
  }

  const { name, email, password } = matchedData(req);

  const existingUserByEmail = await getUserByEmail(email);

  if (existingUserByEmail) {
    return next(new AppError("Email is already in use", 400));
  }

  const salt = await bcrypt.genSalt(10);

  const hashedPassword = await bcrypt.hash(password, salt);

  const user = createUser(name, email, hashedPassword);

  res.status(201).json({
    status: "success",
    message: "User registered successfully",
    data: {
      user: {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    },
  });
});

// User signin controller
export const sigin = catchAsync(async (req, res, next) => {
  await Promise.all(userSigninValidator.map((validator) => validator.run(req)));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array().at(0)?.msg, 400));
  }

  const { email, password } = matchedData(req);

  const user = await getUserWithpassword(email);
  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new AppError("Invalid email or password", 401));
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  user.password = undefined;

  res.status(200).json({
    status: "success",
    message: "Signin successful",
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    },
  });
});
