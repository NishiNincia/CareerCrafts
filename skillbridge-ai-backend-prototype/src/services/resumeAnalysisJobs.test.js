import test from "node:test";
import assert from "node:assert/strict";
import { enqueueResumeAnalysisJob, findResumeAnalysisJob } from "./resumeAnalysisJobs.js";

function fakePool() {
    const jobs = [];
    return {
        jobs,
        async query(sql, values) {
            if (sql.includes("INSERT INTO resume_analysis_jobs")) {
                const [, userId, cacheKey, filename, sourceText, jobDescription] = values;
                const existing = jobs.find((job) => job.user_id === userId && job.cache_key === cacheKey);
                if (existing) return { rows: [] };
                const job = {
                    id: values[0],
                    user_id: userId,
                    cache_key: cacheKey,
                    filename,
                    source_text: sourceText,
                    job_description: jobDescription,
                    status: "queued",
                    stage: "queued",
                    error_code: null,
                    error_message: null,
                    attempt_count: 0,
                    resume_id: null,
                    updated_at: new Date(),
                };
                jobs.push(job);
                return { rows: [job] };
            }
            if (sql.includes("WHERE user_id = $1 AND cache_key = $2")) {
                return { rows: jobs.filter((job) => job.user_id === values[0] && job.cache_key === values[1]) };
            }
            if (sql.includes("WHERE user_id = $1 AND id = $2")) {
                return { rows: jobs.filter((job) => job.user_id === values[0] && job.id === values[1]) };
            }
            throw new Error(`Unexpected query: ${sql}`);
        },
    };
}

test("duplicate analysis submissions return the same job without storing duplicate input", async () => {
    const pool = fakePool();
    const submission = {
        id: "job-first",
        userId: "user-1",
        cacheKey: "same-input",
        filename: "resume.pdf",
        sourceText: "resume contents",
        jobDescription: "",
    };

    const first = await enqueueResumeAnalysisJob(pool, submission);
    const duplicate = await enqueueResumeAnalysisJob(pool, { ...submission, id: "job-second" });

    assert.equal(first.id, duplicate.id);
    assert.equal(pool.jobs.length, 1);
});

test("job status lookup is scoped to the owning user and reflects backend status", async () => {
    const pool = fakePool();
    await enqueueResumeAnalysisJob(pool, {
        id: "job-owner",
        userId: "user-1",
        cacheKey: "cache-key",
        filename: "resume.pdf",
        sourceText: "resume contents",
        jobDescription: "",
    });
    assert.equal((await findResumeAnalysisJob(pool, "user-1", "job-owner")).status, "queued");
    pool.jobs[0].status = "processing";
    pool.jobs[0].stage = "analyzing";

    assert.equal((await findResumeAnalysisJob(pool, "user-1", "job-owner")).stage, "analyzing");
    pool.jobs[0].status = "completed";
    pool.jobs[0].stage = "completed";
    pool.jobs[0].resume_id = "resume-1";
    const completed = await findResumeAnalysisJob(pool, "user-1", "job-owner");
    assert.equal(completed.status, "completed");
    assert.equal(completed.resume_id, "resume-1");
    assert.equal(await findResumeAnalysisJob(pool, "user-2", "job-owner"), null);
});
