import express from "express";
import { sigin, signup } from "../controller/auth.controller.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/login", sigin);

export default router;
