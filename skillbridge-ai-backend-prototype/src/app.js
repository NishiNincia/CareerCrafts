import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import resumeRoutes from "./routes/resume.js";
import recommendationRoutes from "./routes/recommendation.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.get("/", (req, res) => {
    res.send("SkillBridge API Running");
});

export default app;