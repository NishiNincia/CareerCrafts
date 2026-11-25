import { createHash, randomUUID } from "node:crypto";
import pool from "../config/db.js";
import { analyzeResumeText } from "./resumeParser.js";
import { recommendCourses } from "./courseRecommendations.js";
import {
    analyzeResumeWithGemini,
    generateRoleCompetencyProfile,
    geminiAnalysisConfig,
    GeminiAnalysisError,
} from "./geminiService.js";
import { mergeResumeAnalysis } from "./resumeAnalysis.js";
import {
    classifyJobInput,
    inferRoleExperienceLevel,
    RESUME_ANALYSIS_MODES,
} from "./resumeJobContext.js";

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

export async function runRoleOnlyAnalysis(resumeAnalysis, roleProfileGeneration, parentSignal) {
    const requestController = new AbortController();
    const abortRequests = () => requestController.abort();
    if (parentSignal?.aborted) {
        abortRequests();
    } else {
        parentSignal?.addEventListener("abort", abortRequests, { once: true });
    }

    const requests = [
        Promise.resolve().then(() => resumeAnalysis(requestController.signal)),
        Promise.resolve().then(() => roleProfileGeneration(requestController.signal)),
    ];
    try {
        return await Promise.all(requests);
    } catch (error) {
        requestController.abort();
        throw error;
    } finally {
        parentSignal?.removeEventListener("abort", abortRequests);
    }
}

export function hasUsableParsedResume(profile) {
    const contentSections = [
        Boolean(profile.summary),
        (profile.experience || []).some((item) => item.role || item.company || item.bullets?.length),
        (profile.education || []).some((item) => item.degree || item.school),
        (profile.projects || []).some((item) => item.name || item.description || item.technologies?.length),
        (profile.skills || []).length > 0,
        (profile.certifications || []).length > 0,
    ];
    return contentSections.filter(Boolean).length >= 2;
}

export function createParserFallbackProfile(profile) {
    if (!hasUsableParsedResume(profile)) {
        throw new GeminiAnalysisError(
            "Gemini could not identify enough resume content, and local extraction did not find enough structured information to continue.",
            422,
            "GEMINI_EMPTY_ANALYSIS"
        );
    }

    return {
        analysisProvider: "Local Resume Parser",
        analysisModel: "deterministic-parser-fallback",
        professionalSummary: profile.summary || "",
        experienceSummaries: [],
        education: [],
        projectSummaries: [],
        skills: { technical: [], tools: [], soft: [] },
        certifications: [],
        achievements: [],
        competitions: [],
        languages: [],
        interests: [],
        careerFocus: profile.title || "",
        missingKeywords: [],
        resumeStructureAssessment: null,
        jobRequirements: [],
        keywordAnalysis: {
            present: [],
            missingImportant: [],
            presentWithoutEvidence: [],
            shouldHighlight: [],
            requireAcquisition: [],
        },
        experienceRelevance: [],
        projectRelevance: [],
        improvementRecommendations: {
            formatting: [],
            atsOptimization: [],
            experience: [],
            projects: [],
            skills: [],
        },
    };
}

async function analyzeResumeProfile(analysisRequest, parsedResume, jobId) {
    try {
        return await analyzeResumeWithGemini(analysisRequest);
    } catch (error) {
        if (error?.code !== "GEMINI_EMPTY_ANALYSIS" || !hasUsableParsedResume(parsedResume)) {
            throw error;
        }
        console.warn(
            `[Resume analysis] Gemini returned no usable profile; using local extraction job=${jobId} skills=${parsedResume.skills.length} experiences=${parsedResume.experience.length} projects=${parsedResume.projects.length}`
        );
        return createParserFallbackProfile(parsedResume);
    }
}

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
    jobId = null,
    jobTitle = "",
    companyName = "",
    analysisMode = "",
    normalizedRole = "",
    model = geminiAnalysisConfig.model,
    fallbackModel = geminiAnalysisConfig.fallbackModel,
}) {
    return createHash("sha256")
        .update(JSON.stringify({
            version: 5,
            userId,
            sourceText,
            jobDescription,
            jobId,
            jobTitle,
            companyName,
            analysisMode,
            normalizedRole,
            model,
            fallbackModel,
        }))
        .digest("hex");
}

async function updateJobStage(jobId, stage) {
    const result = await pool.query(
        `UPDATE resume_analysis_jobs
         SET stage = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'processing'`,
        [jobId, stage]
    );
    if (result.rowCount) {
        console.info(`[Resume analysis] Job transition id=${jobId} status=processing stage=${stage}`);
    }
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
                parsed_json, source_text, analysis_cache_key, job_id, job_title,
                company_name, custom_job_description, structure_score, compatibility_score,
                job_requirements, skill_comparisons, keyword_analysis,
                experience_relevance, project_relevance, improvement_recommendations
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
                $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
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
                job.job_id,
                job.job_title,
                job.company_name,
                job.job_description,
                parsed.metrics.structureScore,
                parsed.metrics.compatibilityScore,
                JSON.stringify(parsed.metrics.jobRequirements || []),
                JSON.stringify(parsed.metrics.skillComparisons || []),
                JSON.stringify(parsed.metrics.keywordAnalysis || {}),
                JSON.stringify(parsed.metrics.experienceRelevance || []),
                JSON.stringify(parsed.metrics.projectRelevance || []),
                JSON.stringify(parsed.metrics.improvementRecommendations || {}),
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
        console.info(`[Resume analysis] Result persisted job=${job.id} resume=${resumeId} status=completed`);
        return resumeId;
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
    const job = result.rows[0] || null;
    if (job) {
        console.info(`[Resume analysis] Worker pickup id=${job.id} status=queued->processing stage=${job.stage} attempt=${job.attempt_count}`);
    }
    return job;
}

function safeFailureReason(error) {
    if (error instanceof GeminiAnalysisError) {
        const diagnostic = String(error.diagnosticMessage || "");
        const details = diagnostic.match(/^Gemini failure origin=(\S+) sdkErrorName=(\S+) sdkErrorCode=(\S+) httpStatus=(\S+) attempts=(\S+) elapsedMs=(\S+)/);
        if (details) {
            return `origin=${details[1]} sdkErrorName=${details[2]} sdkErrorCode=${details[3]} httpStatus=${details[4]} attempts=${details[5]} elapsedMs=${details[6]} code=${error.code}`;
        }
        return `code=${error.code} httpStatus=${error.status || "n/a"} reason=${error.message}`;
    }
    const errorType = error?.name || "Error";
    const errorCode = error?.code || "n/a";
    const errorStatus = error?.status || "n/a";
    const reason = "Unexpected error while processing the resume analysis.";
    return `errorType=${errorType} errorCode=${errorCode} httpStatus=${errorStatus} reason=${reason}`;
}

async function failJob(job, error) {
    const isGeminiError = error instanceof GeminiAnalysisError;
    const code = isGeminiError ? error.code : "RESUME_ANALYSIS_FAILED";
    const message = isGeminiError
        ? safeFailureReason(error)
        : "Resume analysis failed while saving your results. Please retry.";
    const result = await pool.query(
        `UPDATE resume_analysis_jobs
         SET status = 'failed', stage = 'failed', error_code = $2,
             error_message = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'processing'`,
        [job.id, code, message]
    );
    if (result.rowCount) {
        console.error(`[Resume analysis] Job transition id=${job.id} status=processing->failed code=${code} reason=${safeFailureReason(error)}`);
    } else {
        console.warn(`[Resume analysis] Failure status not updated id=${job.id} expectedStatus=processing code=${code}`);
    }
}

export async function processNextResumeAnalysisJob() {
    const job = await claimNextJob();
    if (!job) return false;
    const startedAt = Date.now();
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), JOB_TIMEOUT_MS);
    console.info(`[Resume analysis] Started job=${job.id} attempt=${job.attempt_count} status=processing`);
    try {
        const parseStartedAt = Date.now();
        const parsedResume = analyzeResumeText(job.source_text);
        console.info(`[Resume analysis] Parser complete job=${job.id} durationMs=${Date.now() - parseStartedAt} skills=${parsedResume.skills.length} experiences=${parsedResume.experience.length} projects=${parsedResume.projects.length}`);
        assertJobNotTimedOut(abortController.signal);
        const jobContext = classifyJobInput({
            jobDescription: job.job_description || "",
            jobId: job.job_id || "",
            jobTitle: job.job_title || "",
        });
        const analysisRequest = {
            resumeText: job.source_text,
            jobDescription: jobContext.mode === RESUME_ANALYSIS_MODES.FULL_JOB_DESCRIPTION
                ? job.job_description
                : null,
            signal: abortController.signal,
        };
        let geminiProfile;
        let roleCompetencyProfile = null;
        if (jobContext.mode === RESUME_ANALYSIS_MODES.ROLE_ONLY) {
            [geminiProfile, roleCompetencyProfile] = await runRoleOnlyAnalysis(
                (signal) => analyzeResumeProfile({ ...analysisRequest, signal }, parsedResume, job.id),
                (signal) => generateRoleCompetencyProfile({
                    roleTitle: jobContext.roleTitle,
                    experienceLevel: inferRoleExperienceLevel(jobContext.roleTitle, parsedResume.careerLevel),
                    signal,
                }),
                abortController.signal
            );
        } else {
            geminiProfile = await analyzeResumeProfile(analysisRequest, parsedResume, job.id);
        }
        assertJobNotTimedOut(abortController.signal);
        const parsed = mergeResumeAnalysis(parsedResume, geminiProfile, {
            ...jobContext,
            roleCompetencyProfile,
        });
        await updateJobStage(job.id, "recommending");
        const recommendationsStartedAt = Date.now();
        const recommendations = await recommendCourses(
            parsed.careerLevel,
            parsed.metrics.missingSkills
        );
        console.info(`[Resume analysis] Recommendations complete job=${job.id} count=${recommendations.length} durationMs=${Date.now() - recommendationsStartedAt}`);
        assertJobNotTimedOut(abortController.signal);
        await updateJobStage(job.id, "saving");
        await saveCompletedAnalysis(job, parsed, recommendations);
        console.info(`[Resume analysis] Completed job=${job.id} status=completed totalDurationMs=${Date.now() - startedAt}`);
    } catch (error) {
        const code = error instanceof GeminiAnalysisError ? error.code : "RESUME_ANALYSIS_FAILED";
        console.error(`[Resume analysis] Job failed id=${job.id} code=${code} reason=${safeFailureReason(error)} totalDurationMs=${Date.now() - startedAt}`);
        try {
            await failJob(job, error);
        } catch (persistenceError) {
            console.error(`[Resume analysis] Could not persist failed status id=${job.id} errorType=${persistenceError?.name || "Error"} errorCode=${persistenceError?.code || "n/a"}`);
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
