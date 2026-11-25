import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import resumeRoutes from "./routes/resume.js";
import recommendationRoutes from "./routes/recommendation.js";
import learningRoutes from "./routes/learning.js";
import jobRoutes from "./routes/job.js";
import notificationRoutes from "./routes/notifications.js";
import chatRoutes from "./routes/chat.js";
import gigRoutes from "./routes/gigs.js";

dotenv.config();

const app = express();

app.set("etag", false);
app.use(cors());

app.use(express.json({ limit: "1mb" }));
app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/v1", jobRoutes);
app.use("/api/v1", gigRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
    res.send("SkillBridge API Running");
});

export default app;