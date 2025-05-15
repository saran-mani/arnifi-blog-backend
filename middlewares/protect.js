import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { catchAsync } from "../utils/catchAsync.js";

const protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    return res.status(401).json({ message: "Unauthorized: User not found" });
  }

  req.user = user;
  next();
});

export default protect;
