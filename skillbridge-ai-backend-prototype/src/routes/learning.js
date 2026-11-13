import express from "express";
import {
    completeExercise,
    completeLesson,
    createLearningRoadmap,
    getLearningRoadmap,
    getLearningResumeContext,
    submitAssessment,
    updateLearningProject,
} from "../controller/learning.js";
import { protect, requireWorker } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect, requireWorker);
router.get("/resume-context", getLearningResumeContext);
router.get("/roadmap", getLearningRoadmap);
router.post("/roadmaps", createLearningRoadmap);
router.post("/roadmaps/:roadmapId/modules/:moduleId/lessons/:lessonId/complete", completeLesson);
router.post("/roadmaps/:roadmapId/modules/:moduleId/exercises/:exerciseId/complete", completeExercise);
router.post("/roadmaps/:roadmapId/assessments/:assessmentId/attempts", submitAssessment);
router.patch("/roadmaps/:roadmapId/projects/:projectId", updateLearningProject);

export default router;
