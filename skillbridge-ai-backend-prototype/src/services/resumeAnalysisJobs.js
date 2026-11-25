export async function enqueueResumeAnalysisJob(pool, { id, userId, cacheKey, filename, sourceText, jobDescription, jobId = null, jobTitle = "", companyName = "" }) {
    const inserted = await pool.query(
        `INSERT INTO resume_analysis_jobs (id, user_id, cache_key, filename, source_text, job_description, job_id, job_title, company_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id, cache_key) DO NOTHING
         RETURNING id, status, stage, error_code, error_message, attempt_count, resume_id, updated_at`,
        [id, userId, cacheKey, filename, sourceText, jobDescription, jobId, jobTitle, companyName]
    );
    if (inserted.rows[0]) {
        console.info(`[Resume analysis] Job created id=${inserted.rows[0].id} status=${inserted.rows[0].status}`);
        return inserted.rows[0];
    }

    const retried = await pool.query(
        `UPDATE resume_analysis_jobs
         SET status = 'queued', stage = 'queued', error_code = NULL,
             error_message = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND cache_key = $2 AND status = 'failed'
         RETURNING id, status, stage, error_code, error_message, attempt_count, resume_id, updated_at`,
        [userId, cacheKey]
    );
    if (retried.rows[0]) {
        console.info(`[Resume analysis] Failed duplicate requeued id=${retried.rows[0].id} status=${retried.rows[0].status}`);
        return retried.rows[0];
    }

    const existing = await pool.query(
        `SELECT id, status, stage, error_code, error_message, attempt_count, resume_id, updated_at
         FROM resume_analysis_jobs
         WHERE user_id = $1 AND cache_key = $2`,
        [userId, cacheKey]
    );
    if (existing.rows[0]) {
        console.info(`[Resume analysis] Existing job reused id=${existing.rows[0].id} status=${existing.rows[0].status}`);
    }
    return existing.rows[0] || null;
}

export async function findResumeAnalysisJob(pool, userId, jobId) {
    const result = await pool.query(
        `SELECT id, status, stage, error_code, error_message, attempt_count, resume_id, updated_at
         FROM resume_analysis_jobs
         WHERE user_id = $1 AND id = $2`,
        [userId, jobId]
    );
    return result.rows[0] || null;
}
