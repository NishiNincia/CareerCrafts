CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'worker',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    provider TEXT NOT NULL,
    duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
    level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
    thumbnail_color TEXT NOT NULL DEFAULT 'bridge',
    match_reason TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS course_skills (
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    PRIMARY KEY (course_id, skill)
);

CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    years_experience NUMERIC(4, 1) NOT NULL DEFAULT 0 CHECK (years_experience >= 0),
    career_level TEXT NOT NULL CHECK (career_level IN ('Beginner', 'Intermediate', 'Advanced')),
    ats_score SMALLINT NOT NULL CHECK (ats_score BETWEEN 0 AND 100),
    resume_score SMALLINT NOT NULL CHECK (resume_score BETWEEN 0 AND 100),
    profile_completion SMALLINT NOT NULL CHECK (profile_completion BETWEEN 0 AND 100),
    skill_strength SMALLINT NOT NULL CHECK (skill_strength BETWEEN 0 AND 100),
    missing_keywords TEXT[] NOT NULL DEFAULT '{}',
    missing_skills TEXT[] NOT NULL DEFAULT '{}',
    parsed_json JSONB NOT NULL,
    source_text TEXT NOT NULL DEFAULT '',
    analysis_cache_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE resumes ADD COLUMN IF NOT EXISTS filename TEXT NOT NULL DEFAULT '';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT '';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS years_experience NUMERIC(4, 1) NOT NULL DEFAULT 0;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS career_level TEXT NOT NULL DEFAULT 'Beginner';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS resume_score SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS profile_completion SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS skill_strength SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS missing_keywords TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS missing_skills TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS parsed_json JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS source_text TEXT NOT NULL DEFAULT '';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS analysis_cache_key TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resumes_career_level_check') THEN
        ALTER TABLE resumes ADD CONSTRAINT resumes_career_level_check
            CHECK (career_level IN ('Beginner', 'Intermediate', 'Advanced'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resumes_years_experience_check') THEN
        ALTER TABLE resumes ADD CONSTRAINT resumes_years_experience_check CHECK (years_experience >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resumes_ats_score_check') THEN
        ALTER TABLE resumes ADD CONSTRAINT resumes_ats_score_check CHECK (ats_score BETWEEN 0 AND 100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resumes_resume_score_check') THEN
        ALTER TABLE resumes ADD CONSTRAINT resumes_resume_score_check CHECK (resume_score BETWEEN 0 AND 100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resumes_profile_completion_check') THEN
        ALTER TABLE resumes ADD CONSTRAINT resumes_profile_completion_check CHECK (profile_completion BETWEEN 0 AND 100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resumes_skill_strength_check') THEN
        ALTER TABLE resumes ADD CONSTRAINT resumes_skill_strength_check CHECK (skill_strength BETWEEN 0 AND 100);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS resumes_user_created_idx ON resumes (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS resumes_user_analysis_cache_idx
    ON resumes (user_id, analysis_cache_key)
    WHERE analysis_cache_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS resume_analysis_jobs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cache_key TEXT NOT NULL,
    filename TEXT NOT NULL,
    source_text TEXT NOT NULL,
    job_description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    stage TEXT NOT NULL DEFAULT 'queued',
    error_code TEXT,
    error_message TEXT,
    resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, cache_key)
);

CREATE INDEX IF NOT EXISTS resume_analysis_jobs_user_created_idx
    ON resume_analysis_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS resume_analysis_jobs_queued_idx
    ON resume_analysis_jobs (status, created_at)
    WHERE status IN ('queued', 'processing');

CREATE TABLE IF NOT EXISTS resume_experience (
    id BIGSERIAL PRIMARY KEY,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    period TEXT NOT NULL DEFAULT '',
    bullets TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS resume_education (
    id BIGSERIAL PRIMARY KEY,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    school TEXT NOT NULL DEFAULT '',
    degree TEXT NOT NULL DEFAULT '',
    year TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS resume_projects (
    id BIGSERIAL PRIMARY KEY,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS resume_skills (
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    PRIMARY KEY (resume_id, skill)
);

CREATE TABLE IF NOT EXISTS resume_certifications (
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    certification TEXT NOT NULL,
    PRIMARY KEY (resume_id, certification)
);

CREATE TABLE IF NOT EXISTS resume_recommendations (
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    rank SMALLINT NOT NULL CHECK (rank > 0),
    matching_skills TEXT[] NOT NULL DEFAULT '{}',
    reason TEXT NOT NULL,
    PRIMARY KEY (resume_id, course_id),
    UNIQUE (resume_id, rank)
);

INSERT INTO courses (id, title, provider, duration_hours, level, thumbnail_color, match_reason)
VALUES
    ('career-foundations', 'Programming Foundations', 'SkillBridge Academy', 10, 'Beginner', 'bridge', 'Build core coding skills for your next career step'),
    ('web-foundations', 'Web Development Foundations', 'SkillBridge Academy', 12, 'Beginner', 'signal', 'Learn the fundamentals behind modern web applications'),
    ('git-collaboration', 'Git and Collaborative Development', 'SkillBridge Academy', 6, 'Beginner', 'emerald', 'Strengthen your version control and team workflow skills'),
    ('react-production', 'Building Production Web Apps with React', 'SkillBridge Academy', 16, 'Intermediate', 'bridge', 'Apply modern frontend skills to production applications'),
    ('sql-data-modeling', 'SQL and Relational Data Modeling', 'SkillBridge Academy', 12, 'Intermediate', 'signal', 'Build practical database and query design skills'),
    ('automated-testing', 'Automated Testing for Web Applications', 'SkillBridge Academy', 10, 'Intermediate', 'emerald', 'Improve software quality with reliable automated tests'),
    ('system-design', 'System Design and Distributed Architecture', 'SkillBridge Academy', 18, 'Advanced', 'bridge', 'Develop skills for designing scalable distributed systems'),
    ('cloud-architecture', 'Cloud Architecture and Deployment', 'SkillBridge Academy', 14, 'Advanced', 'signal', 'Advance your cloud infrastructure and deployment knowledge'),
    ('application-security', 'Application Security Engineering', 'SkillBridge Academy', 12, 'Advanced', 'emerald', 'Strengthen application security and threat modeling skills')
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_skills (course_id, skill)
VALUES
    ('career-foundations', 'programming'),
    ('career-foundations', 'javascript'),
    ('web-foundations', 'html'),
    ('web-foundations', 'css'),
    ('web-foundations', 'javascript'),
    ('git-collaboration', 'git'),
    ('git-collaboration', 'collaboration'),
    ('react-production', 'react'),
    ('react-production', 'typescript'),
    ('react-production', 'performance'),
    ('sql-data-modeling', 'sql'),
    ('sql-data-modeling', 'data modeling'),
    ('automated-testing', 'automated testing'),
    ('automated-testing', 'unit testing'),
    ('automated-testing', 'integration testing'),
    ('system-design', 'system design'),
    ('system-design', 'distributed systems'),
    ('system-design', 'scalability'),
    ('cloud-architecture', 'cloud architecture'),
    ('cloud-architecture', 'deployment'),
    ('cloud-architecture', 'ci/cd'),
    ('application-security', 'security'),
    ('application-security', 'application security'),
    ('application-security', 'threat modeling')
ON CONFLICT (course_id, skill) DO NOTHING;
