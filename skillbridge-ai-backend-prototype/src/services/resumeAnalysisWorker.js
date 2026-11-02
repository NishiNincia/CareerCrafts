import { createHash, randomUUID } from "node:crypto";
import pool from "../config/db.js";
import { analyzeResumeText } from "./resumeParser.js";
import { recommendCourses } from "./courseRecommendations.js";
import { analyzeResumeWithGemini, geminiAnalysisConfig, GeminiAnalysisError } from "./geminiService.js";
import { mergeResumeAnalysis } from "./resumeAnalysis.js";

const WORKER_INTERVAL_MS = 1_500;
const DEFAULT_JOB_TIMEOUT_MS = 155_000;
const MIN_JOB_TIMEOUT_MS = geminiAnalysisConfig.retryBudgetMs + 15_000;
const JOB_TIMEOUT_MS = Math.max(
    MIN_JOB_TIMEOUT_MS,
    Number(process.env.RESUME_ANALYSIS_JOB_TIMEOUT_MS) || DEFAULT_JOB_TIMEOUT_MS
);
const STALE_JOB_MS = Math.max(
    JOB_TIMEOUT_MS + 30_000,
    Number(process.env.RESUME_ANALYSIS_JOB_LEASE_MS) || 185_000
);

export const resumeAnalysisWorkerConfig = {
    jobTimeoutMs: JOB_TIMEOUT_MS,
    leaseMs: STALE_JOB_MS,
    minimumJobTimeoutMs: MIN_JOB_TIMEOUT_MS,
};

function assertJobNotTimedOut(signal) {
    if (signal.aborted) {
        throw new GeminiAnalysisError(
            "The resume analysis job exceeded its configured worker time limit.",
            504,
            "GEMINI_JOB_TIMEOUT"
        );
    }
}

export function createResumeAnalysisCacheKey({
    userId,
    sourceText,
    jobDescription,
    model = geminiAnalysisConfig.model,
    fallbackModel = geminiAnalysisConfig.fallbackModel,
}) {
    return createHash("sha256")
        .update(JSON.stringify({
            version: 3,
            userId,
            sourceText,
            jobDescription,
            model,
            fallbackModel,
        }))
        .digest("hex");
}

async function updateJobStage(jobId, stage) {
    await pool.query(
        `UPDATE resume_analysis_jobs
         SET stage = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'processing'`,
        [jobId, stage]
    );
}

async function saveCompletedAnalysis(job, parsed, recommendations) {
    const client = await pool.connect();
    const resumeId = randomUUID();
    try {
        await client.query("BEGIN");
        const inserted = await client.query(
            `INSERT INTO resumes (
                id, user_id, filename, name, title, summary, email, phone,
                years_experience, career_level, ats_score, resume_score,
                profile_completion, skill_strength, missing_keywords, missing_skills,
                parsed_json, source_text, analysis_cache_key
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
            )
            RETURNING id`,
            [
                resumeId,
                job.user_id,
                job.filename,
                parsed.name,
                parsed.title,
                parsed.summary,
                parsed.email,
                parsed.phone,
                parsed.yearsExperience,
                parsed.careerLevel,
                parsed.metrics.atsScore,
                parsed.metrics.resumeScore,
                parsed.metrics.profileCompletion,
                parsed.metrics.skillStrength,
                parsed.metrics.missingKeywords,
                parsed.metrics.missingSkills,
                JSON.stringify(parsed),
                job.source_text,
                job.cache_key,
            ]
        );
        for (const experience of parsed.experience || []) {
            await client.query(
                `INSERT INTO resume_experience (resume_id, role, company, period, bullets)
                 VALUES ($1, $2, $3, $4, $5)`,
                [resumeId, experience.role, experience.company, experience.period, experience.bullets]
            );
        }
        for (const education of parsed.education || []) {
            await client.query(
                `INSERT INTO resume_education (resume_id, school, degree, year)
                 VALUES ($1, $2, $3, $4)`,
                [resumeId, education.school, education.degree, education.year]
            );
        }
        for (const project of parsed.projects || []) {
            await client.query(
                `INSERT INTO resume_projects (resume_id, name, description)
                 VALUES ($1, $2, $3)`,
                [resumeId, project.name, project.description]
            );
        }
        for (const skill of parsed.skills || []) {
            await client.query(
                "INSERT INTO resume_skills (resume_id, skill) VALUES ($1, $2)",
                [resumeId, skill]
            );
        }
        for (const certification of parsed.certifications || []) {
            await client.query(
                "INSERT INTO resume_certifications (resume_id, certification) VALUES ($1, $2)",
                [resumeId, certification]
            );
        }
        for (const [index, course] of recommendations.entries()) {
            await client.query(
                `INSERT INTO resume_recommendations (resume_id, course_id, rank, matching_skills, reason)
                 VALUES ($1, $2, $3, $4, $5)`,
                [resumeId, course.id, index + 1, course.matchingSkills, course.matchReason]
            );
        }
        const completed = await client.query(
            `UPDATE resume_analysis_jobs
             SET status = 'completed', stage = 'completed', resume_id = $2,
                 error_code = NULL, error_message = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND status = 'processing'`,
            [job.id, inserted.rows[0].id]
        );
        if (completed.rowCount !== 1) {
            throw new Error("Resume analysis job was no longer processing when its results were saved.");
        }
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function claimNextJob() {
    const result = await pool.query(
        `WITH next_job AS (
            SELECT id
            FROM resume_analysis_jobs
            WHERE status = 'queued'
            ORDER BY created_at, id
            FOR UPDATE SKIP LOCKED
            LIMIT 1
         )
         UPDATE resume_analysis_jobs job
         SET status = 'processing', stage = 'analyzing',
             attempt_count = attempt_count + 1, updated_at = CURRENT_TIMESTAMP
         FROM next_job
         WHERE job.id = next_job.id
         RETURNING job.*`
    );
    return result.rows[0] || null;
}

async function failJob(job, error) {
    const isGeminiError = error instanceof GeminiAnalysisError;
    const code = isGeminiError ? error.code : "RESUME_ANALYSIS_FAILED";
    const message = isGeminiError
        ? error.diagnosticMessage || error.message
        : "Resume analysis failed while saving your results. Please retry.";
    await pool.query(
        `UPDATE resume_analysis_jobs
         SET status = 'failed', stage = 'failed', error_code = $2,
             error_message = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'processing'`,
        [job.id, code, message]
    );
}

export async function processNextResumeAnalysisJob() {
    const job = await claimNextJob();
    if (!job) return false;
    const startedAt = Date.now();
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), JOB_TIMEOUT_MS);
    console.info(`[Resume analysis] Started job=${job.id} attempt=${job.attempt_count} resumeChars=${job.source_text.length} jobDescriptionChars=${job.job_description.length}`);
    try {
        const parseStartedAt = Date.now();
        const parsedResume = analyzeResumeText(job.source_text);
        console.info(`[Resume analysis] Parser complete job=${job.id} durationMs=${Date.now() - parseStartedAt} skills=${parsedResume.skills.length} experiences=${parsedResume.experience.length} projects=${parsedResume.projects.length}`);
        assertJobNotTimedOut(abortController.signal);
        const geminiProfile = await analyzeResumeWithGemini({
            resumeText: job.source_text,
            jobDescription: job.job_description || null,
            signal: abortController.signal,
        });
        assertJobNotTimedOut(abortController.signal);
        const parsed = mergeResumeAnalysis(parsedResume, geminiProfile, job.job_description);
        await updateJobStage(job.id, "recommending");
        const recommendationsStartedAt = Date.now();
        const recommendations = await recommendCourses(
            parsed.careerLevel,
            job.job_description && parsed.metrics.missingKeywords.length
                ? parsed.metrics.missingKeywords
                : parsed.metrics.missingSkills
        );
        console.info(`[Resume analysis] Recommendations complete job=${job.id} count=${recommendations.length} durationMs=${Date.now() - recommendationsStartedAt}`);
        assertJobNotTimedOut(abortController.signal);
        await updateJobStage(job.id, "saving");
        await saveCompletedAnalysis(job, parsed, recommendations);
        console.info(`[Resume analysis] Completed job=${job.id} totalDurationMs=${Date.now() - startedAt}`);
    } catch (error) {
        console.error(`[Resume analysis] Job failed id=${job.id} code=${error?.code || "UNKNOWN"} totalDurationMs=${Date.now() - startedAt}:`, error);
        try {
            await failJob(job, error);
        } catch (persistenceError) {
            console.error(`[Resume analysis] Could not mark job failed id=${job.id}:`, persistenceError);
        }
    } finally {
        clearTimeout(timeout);
    }
    return true;
}

export function startResumeAnalysisWorker({
    intervalMs = WORKER_INTERVAL_MS,
    staleJobMs = STALE_JOB_MS,
    processNext = processNextResumeAnalysisJob,
} = {}) {
    let active = false;
    const recoverStaleJobs = async () => {
        const recovered = await pool.query(
            `UPDATE resume_analysis_jobs
             SET status = 'queued', stage = 'queued', updated_at = CURRENT_TIMESTAMP
             WHERE status = 'processing'
               AND updated_at < CURRENT_TIMESTAMP - ($1 * INTERVAL '1 millisecond')`,
            [staleJobMs]
        );
        if (recovered.rowCount) {
            console.warn(`[Resume analysis] Requeued stale jobs count=${recovered.rowCount}`);
        }
    };

    const tick = async () => {
        if (active) return;
        active = true;
        try {
            await recoverStaleJobs();
            await processNext();
        } catch (error) {
            console.error("[Resume analysis] Worker poll failed:", error);
        } finally {
            active = false;
        }
    };
    const timer = setInterval(tick, intervalMs);
    timer.unref();
    void tick();
    return () => clearInterval(timer);
}
