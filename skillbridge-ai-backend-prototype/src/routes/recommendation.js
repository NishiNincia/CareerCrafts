import express from "express";
import { getCourseRecommendations } from "../controller/recommendation.js";
import { protect, requireWorker } from "../middlewares/auth.js";

const router = express.Router();

router.get("/courses", protect, requireWorker, getCourseRecommendations);

export default router;