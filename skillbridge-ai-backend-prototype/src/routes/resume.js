import express from "express";
import multer from "multer";
import {
    analyzeResume,
    getLatestResume,
    getResumeAnalysisJob,
    retryResumeAnalysisJob,
} from "../controller/resume.js";
import { protect, requireWorker } from "../middlewares/auth.js";

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
        const extension = file.originalname.toLowerCase().split(".").pop();
        const supported =
            (extension === "pdf" && file.mimetype === "application/pdf") ||
            (extension === "docx" && file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        if (!supported) {
            const error = new Error("Only PDF and DOCX resumes are supported.");
            error.status = 415;
            callback(error);
            return;
        }
        callback(null, true);
    },
});

function handleResumeUpload(req, res, next) {
    upload.single("resume")(req, res, (error) => {
        if (!error) {
            next();
            return;
        }

        const status = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
            ? 413
            : error.status || 400;
        res.status(status).json({ success: false, message: error.message });
    });
}

router.post("/analyze", protect, requireWorker, handleResumeUpload, analyzeResume);
router.get("/jobs/:jobId", protect, requireWorker, getResumeAnalysisJob);
router.post("/jobs/:jobId/retry", protect, requireWorker, retryResumeAnalysisJob);
router.get("/latest", protect, requireWorker, getLatestResume);

export default router;