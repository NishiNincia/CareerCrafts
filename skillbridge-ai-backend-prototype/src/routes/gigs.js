import express from "express";
import { createEmployerGig, getWorkerGigs } from "../controller/gigs.js";
import { protect, requireEmployer, requireWorker } from "../middlewares/auth.js";

const router = express.Router();

router.get("/worker/gigs", protect, requireWorker, getWorkerGigs);
router.post("/employer/gigs", protect, requireEmployer, createEmployerGig);

export default router;
