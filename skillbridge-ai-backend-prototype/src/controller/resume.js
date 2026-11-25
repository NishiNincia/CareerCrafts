import { randomUUID } from "node:crypto";
import pool from "../config/db.js";
import { extractResumeText } from "../services/resumeFile.js";
import { geminiAnalysisConfig } from "../services/geminiService.js";
import { createResumeAnalysisCacheKey } from "../services/resumeAnalysisWorker.js";
import { enqueueResumeAnalysisJob, findResumeAnalysisJob } from "../services/resumeAnalysisJobs.js";
import { classifyJobInput, RESUME_ANALYSIS_MODES } from "../services/resumeJobContext.js";

function toResumeResponse(id, filename, parsed, recommendations, createdAt) {
    return {
        id,
        filename,
        ...parsed,
        createdAt,
        recommendations,
    };
}

async function loadResume(userId, resumeId) {
    const result = await pool.query(
        `SELECT id, filename, parsed_json, created_at, job_id, job_title, company_name,
                custom_job_description, structure_score, compatibility_score,
                job_requirements, skill_comparisons, keyword_analysis,
                experience_relevance, project_relevance, improvement_recommendations
         FROM resumes
         WHERE user_id = $1 AND id = $2
         LIMIT 1`,
        [userId, resumeId]
    );
    if (!result.rows.length) return null;

    const row = result.rows[0];
    const recommendationRows = await pool.query(
        `SELECT c.id, c.title, c.provider, c.duration_hours, c.level, c.thumbnail_color,
                rr.matching_skills, rr.reason
         FROM resume_recommendations rr
         JOIN courses c ON c.id = rr.course_id
         WHERE rr.resume_id = $1
         ORDER BY rr.rank`,
        [row.id]
    );
    const recommendations = recommendationRows.rows.map((course) => ({
        id: course.id,
        title: course.title,
        provider: course.provider,
        durationHours: course.duration_hours,
        level: course.level,
        progress: 0,
        thumbnailColor: course.thumbnail_color,
        matchReason: course.reason,
        matchingSkills: course.matching_skills,
    }));
    const parsed = {
        ...row.parsed_json,
        job: {
            id: row.job_id,
            title: row.job_title,
            company: row.company_name,
            description: row.custom_job_description,
        },
        metrics: {
            ...(row.parsed_json?.metrics || {}),
            structureScore: row.structure_score,
            compatibilityScore: row.compatibility_score,
            jobRequirements: row.job_requirements,
            skillComparisons: row.skill_comparisons,
            keywordAnalysis: row.keyword_analysis,
            experienceRelevance: row.experience_relevance,
            projectRelevance: row.project_relevance,
            improvementRecommendations: row.improvement_recommendations,
        },
    };
    return toResumeResponse(row.id, row.filename, parsed, recommendations, row.created_at);
}

function toJobResponse(row, resume = null) {
    return {
        id: row.id,
        status: row.status,
        stage: row.stage,
        errorCode: row.error_code,
        errorMessage: row.error_message,
        attemptCount: row.attempt_count,
        updatedAt: row.updated_at,
        resume,
    };
}

export async function analyzeResume(req, res) {
    try {
        let resumeText;
        let filename = "pasted-resume.txt";

        if (req.file) {
            filename = req.file.originalname;
            resumeText = await extractResumeText(req.file);
        } else if (typeof req.body?.resumeText === "string") {
            resumeText = req.body.resumeText;
        } else {
            return res.status(400).json({
                success: false,
                message: "Upload a PDF or DOCX file, or provide resumeText.",
            });
        }

        if (!resumeText.trim()) {
            return res.status(422).json({
                success: false,
                message: "No readable text was found in the resume.",
            });
        }
        if (resumeText.length > 100_000) {
            return res.status(413).json({
                success: false,
                message: "Resume text exceeds the 100,000 character limit.",
            });
        }

        const jobDescription = typeof req.body?.jobDescription === "string" ? req.body.jobDescription.trim() : "";
        if (jobDescription.length > 20_000) {
            return res.status(413).json({
                success: false,
                message: "Job description exceeds the 20,000 character limit.",
            });
        }
        const requestedJobTitle = typeof req.body?.jobTitle === "string" ? req.body.jobTitle.trim() : "";
        if (requestedJobTitle.length > 200) {
            return res.status(413).json({
                success: false,
                message: "Job title exceeds the 200 character limit.",
            });
        }

        let selectedJob = null;
        const requestedJobId = typeof req.body?.jobId === "string" ? req.body.jobId.trim() : "";
        if (requestedJobId) {
            const jobResult = await pool.query(
                `SELECT j.id, j.title, j.description, employer.name AS company,
                        COALESCE(ARRAY(
                            SELECT skill.skill FROM marketplace_job_skills skill
                            WHERE skill.job_id = j.id ORDER BY skill.skill
                        ), ARRAY[]::TEXT[]) AS skills
                 FROM marketplace_jobs j
                 JOIN users employer ON employer.id = j.employer_user_id
                 WHERE j.id = $1 AND j.status = 'open'
                 LIMIT 1`,
                [requestedJobId]
            );
            if (!jobResult.rows.length) {
                return res.status(404).json({ success: false, message: "The selected job was not found or is no longer open." });
            }
            selectedJob = jobResult.rows[0];
        }
        let effectiveJobDescription = selectedJob
            ? `Job title: ${selectedJob.title}\nCompany: ${selectedJob.company}\nDescription:\n${selectedJob.description}\nRequired skills: ${(selectedJob.skills || []).join(", ")}`
            : jobDescription;
        const jobContext = classifyJobInput({
            jobDescription: effectiveJobDescription,
            jobId: selectedJob?.id || "",
            jobTitle: selectedJob?.title || requestedJobTitle,
        });
        if (jobContext.mode === RESUME_ANALYSIS_MODES.ROLE_ONLY) {
            effectiveJobDescription = jobContext.roleTitle;
        }
        if (effectiveJobDescription.length > 20_000) {
            return res.status(413).json({ success: false, message: "Job description exceeds the 20,000 character limit." });
        }

        const jobTitle = selectedJob?.title || jobContext.roleTitle || requestedJobTitle;
        const cacheKey = createResumeAnalysisCacheKey({
            userId: req.user.id,
            sourceText: resumeText,
            jobDescription: effectiveJobDescription,
            jobId: selectedJob?.id || null,
            jobTitle,
            companyName: selectedJob?.company || "",
            analysisMode: jobContext.mode,
            normalizedRole: jobContext.normalizedRole,
            model: geminiAnalysisConfig.model,
            fallbackModel: geminiAnalysisConfig.fallbackModel,
        });
        const cached = await pool.query(
            `SELECT id, filename, parsed_json, created_at
             FROM resumes
             WHERE user_id = $1 AND analysis_cache_key = $2
             LIMIT 1`,
            [req.user.id, cacheKey]
        );
        if (cached.rows.length) {
            const resume = await loadResume(req.user.id, cached.rows[0].id);
            const jobResult = await pool.query(
                `SELECT id, status, stage, error_code, error_message, attempt_count, updated_at
                 FROM resume_analysis_jobs
                 WHERE user_id = $1 AND cache_key = $2`,
                [req.user.id, cacheKey]
            );
            return res.status(200).json({
                success: true,
                job: jobResult.rows[0]
                    ? toJobResponse(jobResult.rows[0], resume)
                    : { id: null, status: "completed", stage: "completed", resume },
                resume,
            });
        }

        const job = await enqueueResumeAnalysisJob(pool, {
            id: randomUUID(),
            userId: req.user.id,
            cacheKey,
            filename,
            sourceText: resumeText,
            jobDescription: effectiveJobDescription,
            jobId: selectedJob?.id || null,
            jobTitle,
            companyName: selectedJob?.company || "",
        });
        if (!job) throw new Error("Resume analysis job was not available after enqueue.");
        console.info(`[Resume API] Analysis accepted job=${job.id} initialStatus=${job.status} mode=${jobContext.mode}`);

        if (job.status === "completed" && job.resume_id) {
            const resume = await loadResume(req.user.id, job.resume_id);
            return res.status(200).json({ success: true, job: toJobResponse(job, resume), resume });
        }
        return res.status(202).json({ success: true, job: toJobResponse(job) });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message, code: error.code });
        }
        console.error("Could not enqueue resume analysis:", error);
        return res.status(500).json({
            success: false,
            message: "Could not start resume analysis. Please try again.",
        });
    }
}

async function getJobByCacheKey(userId, cacheKey) {
    const result = await pool.query(
        `SELECT id, status, stage, error_code, error_message, attempt_count, resume_id, updated_at
         FROM resume_analysis_jobs
         WHERE user_id = $1 AND cache_key = $2`,
        [userId, cacheKey]
    );
    return result.rows[0] || null;
}

export async function getResumeAnalysisJob(req, res) {
    try {
        const job = await findResumeAnalysisJob(pool, req.user.id, req.params.jobId);
        if (!job) return res.status(404).json({ success: false, message: "Resume analysis job was not found." });
        const resume = job.status === "completed" && job.resume_id
            ? await loadResume(req.user.id, job.resume_id)
            : null;
        return res.json({ success: true, job: toJobResponse(job, resume) });
    } catch (error) {
        console.error("Loading resume analysis status failed:", error);
        return res.status(500).json({ success: false, message: "Could not load resume analysis status." });
    }
}

export async function retryResumeAnalysisJob(req, res) {
    try {
        const retried = await pool.query(
            `UPDATE resume_analysis_jobs
             SET status = 'queued', stage = 'queued', error_code = NULL,
                 error_message = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2 AND status = 'failed'
             RETURNING id, status, stage, error_code, error_message, attempt_count, updated_at`,
            [req.params.jobId, req.user.id]
        );
        if (retried.rows.length) {
            console.info(`[Resume API] Job transition id=${retried.rows[0].id} status=failed->queued`);
            return res.status(202).json({ success: true, job: toJobResponse(retried.rows[0]) });
        }

        const job = await findResumeAnalysisJob(pool, req.user.id, req.params.jobId);
        if (!job) return res.status(404).json({ success: false, message: "Resume analysis job was not found." });
        if (job.status === "completed" && job.resume_id) {
            const resume = await loadResume(req.user.id, job.resume_id);
            return res.json({ success: true, job: toJobResponse(job, resume) });
        }
        return res.status(409).json({
            success: false,
            message: `Only failed analyses can be retried. Current status: ${job.status}.`,
        });
    } catch (error) {
        console.error("Retrying resume analysis failed:", error);
        return res.status(500).json({ success: false, message: "Could not retry resume analysis." });
    }
}

export async function getLatestResume(req, res) {
    try {
        const result = await pool.query(
            `SELECT id
             FROM resumes
             WHERE user_id = $1
             ORDER BY created_at DESC, id DESC
             LIMIT 1`,
            [req.user.id]
        );
        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: "No analyzed resume was found." });
        }

        const resume = await loadResume(req.user.id, result.rows[0].id);
        return res.json({ success: true, resume });
    } catch (error) {
        console.error("Loading analyzed resume failed:", error);
        return res.status(500).json({ success: false, message: "Could not load the analyzed resume." });
    }
}

export async function getResumeHistory(req, res) {
    try {
        const result = await pool.query(
            `SELECT id
             FROM resumes
             WHERE user_id = $1
             ORDER BY created_at DESC, id DESC
             LIMIT 50`,
            [req.user.id]
        );
        const resumes = [];
        for (const row of result.rows) {
            const resume = await loadResume(req.user.id, row.id);
            if (resume) resumes.push(resume);
        }
        return res.json({ success: true, data: resumes });
    } catch (error) {
        console.error("Loading resume analysis history failed:", error);
        return res.status(500).json({ success: false, message: "Could not load resume analysis history." });
    }
}
