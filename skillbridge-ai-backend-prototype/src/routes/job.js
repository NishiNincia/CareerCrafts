import express from "express";
import { protect, requireWorker, requireEmployer } from "../middlewares/auth.js";
import {
    applyToJob,
    closeEmployerJob,
    createEmployerJob,
    getEmployerJobs,
    getNearbyJobs,
    updateEmployerJob,
} from "../controller/jobs.js";

const router = express.Router();

router.get("/worker/jobs", protect, requireWorker, getNearbyJobs);
router.post("/worker/jobs/:jobId/applications", protect, requireWorker, applyToJob);
router.get("/employer/jobs", protect, requireEmployer, getEmployerJobs);
router.post("/employer/jobs", protect, requireEmployer, createEmployerJob);
router.put("/employer/jobs/:jobId", protect, requireEmployer, updateEmployerJob);
router.delete("/employer/jobs/:jobId", protect, requireEmployer, closeEmployerJob);

export default router;
