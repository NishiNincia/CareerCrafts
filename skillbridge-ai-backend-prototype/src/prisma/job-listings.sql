CREATE TABLE IF NOT EXISTS marketplace_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    employment_type TEXT NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contract')),
    salary_min NUMERIC(12, 2) NOT NULL CHECK (salary_min > 0),
    salary_max NUMERIC(12, 2) NOT NULL CHECK (salary_max >= salary_min),
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS marketplace_jobs_employer_created_idx
    ON marketplace_jobs (employer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_jobs_open_status_idx
    ON marketplace_jobs (status, created_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_job_skills (
    job_id UUID NOT NULL REFERENCES marketplace_jobs(id) ON DELETE CASCADE,
    skill TEXT NOT NULL CHECK (length(trim(skill)) > 0),
    PRIMARY KEY (job_id, skill)
);

CREATE INDEX IF NOT EXISTS marketplace_job_skills_skill_idx
    ON marketplace_job_skills (lower(skill));

CREATE TABLE IF NOT EXISTS marketplace_job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES marketplace_jobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'interview', 'hired', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (job_id, worker_id)
);
CREATE INDEX IF NOT EXISTS marketplace_job_applications_worker_idx
    ON marketplace_job_applications (worker_id, created_at DESC);
