export async function enqueueResumeAnalysisJob(pool, { id, userId, cacheKey, filename, sourceText, jobDescription }) {
    const inserted = await pool.query(
        `INSERT INTO resume_analysis_jobs (id, user_id, cache_key, filename, source_text, job_description)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, cache_key) DO NOTHING
         RETURNING id, status, stage, error_code, error_message, attempt_count, resume_id, updated_at`,
        [id, userId, cacheKey, filename, sourceText, jobDescription]
    );
    if (inserted.rows[0]) return inserted.rows[0];

    const existing = await pool.query(
        `SELECT id, status, stage, error_code, error_message, attempt_count, resume_id, updated_at
         FROM resume_analysis_jobs
         WHERE user_id = $1 AND cache_key = $2`,
        [userId, cacheKey]
    );
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
