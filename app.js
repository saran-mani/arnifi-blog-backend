import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.router.js";
import blogRoutes from "./routes/blog.router.js";
import rateLimit from "express-rate-limit";
import errorController from "./controller/error.controller.js";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB Connected"))
  .catch((e) => console.log("DB Not Connected!"));

app.use(bodyParser.json());

app.use(morgan("dev"));
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

app.use(limiter);

const corsOptions = {
  origin: "*",
  methods: "GET,POST,PUT,DELETE",
};

app.use(cors(corsOptions));
app.use(helmet());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Hello Arnifi",
  });
});

// Authentication Routes
app.use("/api/v1/auth", authRoutes);

// Blogs Routes
app.use("/api/v1/blogs", blogRoutes);

app.use(errorController);

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
