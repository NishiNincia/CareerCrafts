-- =========================================================================
-- JOBS
-- =========================================================================

CREATE TABLE jobs (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id                 UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
    title                       VARCHAR(255) NOT NULL,
    description                 TEXT NOT NULL,
    category                    VARCHAR(100),
    employment_type             VARCHAR(20) NOT NULL DEFAULT 'FULL_TIME',
    min_salary                  NUMERIC(12,2),
    max_salary                  NUMERIC(12,2),
    experience_required_years   INT,
    required_skills             TEXT,
    address                     TEXT,
    location                    geometry(Point,4326),
    status                      VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    openings                    INT NOT NULL DEFAULT 1,
    views_count                 BIGINT NOT NULL DEFAULT 0,
    is_deleted                  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_job_employer ON jobs(employer_id);
CREATE INDEX idx_job_status ON jobs(status);
CREATE INDEX idx_job_category ON jobs(category);
CREATE INDEX idx_job_location ON jobs USING GIST (location);

CREATE TABLE job_applications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id       UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    status          VARCHAR(30) NOT NULL DEFAULT 'APPLIED',
    cover_note      TEXT,
    match_score     DOUBLE PRECISION,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_application_job_worker UNIQUE (job_id, worker_id)
);
CREATE INDEX idx_application_job ON job_applications(job_id);
CREATE INDEX idx_application_worker ON job_applications(worker_id);

CREATE TABLE job_bookmarks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id       UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_bookmark_worker_job UNIQUE (worker_id, job_id)
);

-- =========================================================================
-- HOURLY GIGS
-- =========================================================================

CREATE TABLE hourly_gigs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id         UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    category            VARCHAR(100),
    hourly_rate         NUMERIC(10,2) NOT NULL,
    estimated_hours     DOUBLE PRECISION,
    scheduled_start     TIMESTAMPTZ NOT NULL,
    expires_at          TIMESTAMPTZ NOT NULL,
    address             TEXT,
    location            geometry(Point,4326) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gig_employer ON hourly_gigs(employer_id);
CREATE INDEX idx_gig_status ON hourly_gigs(status);
CREATE INDEX idx_gig_location ON hourly_gigs USING GIST (location);

CREATE TABLE gig_dispatches (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id                  UUID NOT NULL REFERENCES hourly_gigs(id) ON DELETE CASCADE,
    worker_id               UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    status                  VARCHAR(20) NOT NULL DEFAULT 'OFFERED',
    offered_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at            TIMESTAMPTZ,
    start_otp_hash          VARCHAR(255),
    completion_otp_hash     VARCHAR(255),
    started_at              TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    is_deleted              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dispatch_gig ON gig_dispatches(gig_id);
CREATE INDEX idx_dispatch_worker ON gig_dispatches(worker_id);

CREATE TABLE gig_ratings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id          UUID NOT NULL REFERENCES hourly_gigs(id) ON DELETE CASCADE,
    rater_user_id   UUID NOT NULL REFERENCES users(id),
    ratee_user_id   UUID NOT NULL REFERENCES users(id),
    stars           INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment         TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gig_rating_gig ON gig_ratings(gig_id);
CREATE INDEX idx_gig_rating_ratee ON gig_ratings(ratee_user_id);

-- =========================================================================
-- RESUMES
-- =========================================================================

CREATE TABLE resumes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id       UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    file_url        TEXT NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT,
    content_type    VARCHAR(100),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    parse_status    VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_resume_worker ON resumes(worker_id);

CREATE TABLE resume_metadata (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id                   UUID NOT NULL UNIQUE REFERENCES resumes(id) ON DELETE CASCADE,
    candidate_name              VARCHAR(255),
    email                       VARCHAR(255),
    phone                       VARCHAR(20),
    extracted_skills            TEXT,
    total_experience_years      DOUBLE PRECISION,
    highest_education           VARCHAR(255),
    raw_text                    TEXT,
    is_deleted                  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE resume_scores (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id           UUID NOT NULL UNIQUE REFERENCES resumes(id) ON DELETE CASCADE,
    overall_score       DOUBLE PRECISION NOT NULL,
    formatting_score    DOUBLE PRECISION,
    content_score       DOUBLE PRECISION,
    keyword_score       DOUBLE PRECISION,
    feedback            TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ats_scores (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id           UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_id              UUID REFERENCES jobs(id) ON DELETE SET NULL,
    ats_score           DOUBLE PRECISION NOT NULL,
    missing_keywords    TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ats_score_resume ON ats_scores(resume_id);

CREATE TABLE skill_gaps (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id                   UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    job_id                      UUID REFERENCES jobs(id) ON DELETE SET NULL,
    missing_skill               VARCHAR(255) NOT NULL,
    recommended_course_id       UUID,
    priority                    VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    is_deleted                  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_skill_gap_worker ON skill_gaps(worker_id);
