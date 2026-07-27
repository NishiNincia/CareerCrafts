-- SkillBridge AI - Initial schema
-- Requires PostGIS extension for geometry columns used by jobs/gigs/tracking.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- =========================================================================
-- USERS & AUTH
-- =========================================================================

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    phone               VARCHAR(20) UNIQUE,
    password_hash       VARCHAR(255),
    full_name           VARCHAR(255) NOT NULL,
    role                VARCHAR(20) NOT NULL CHECK (role IN ('WORKER','EMPLOYER','ADMIN')),
    google_id           VARCHAR(255),
    profile_photo_url   TEXT,
    is_email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    is_phone_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    enabled             BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE refresh_tokens (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash              VARCHAR(512) NOT NULL UNIQUE,
    expires_at              TIMESTAMPTZ NOT NULL,
    revoked                 BOOLEAN NOT NULL DEFAULT FALSE,
    replaced_by_token_hash  VARCHAR(512),
    device_info             VARCHAR(255),
    is_deleted              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_token_user ON refresh_tokens(user_id);

CREATE TABLE otp_verifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone           VARCHAR(20) NOT NULL,
    otp_hash        VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    consumed        BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_count   INT NOT NULL DEFAULT 0,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_phone ON otp_verifications(phone);

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID,
    action          VARCHAR(255) NOT NULL,
    entity_type     VARCHAR(100),
    entity_id       UUID,
    metadata        TEXT,
    ip_address      VARCHAR(64),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_user ON audit_logs(user_id);
CREATE INDEX idx_audit_log_entity ON audit_logs(entity_type, entity_id);

-- =========================================================================
-- WORKER PROFILE
-- =========================================================================

CREATE TABLE worker_profiles (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio                     TEXT,
    date_of_birth           DATE,
    gender                  VARCHAR(20),
    years_of_experience     INT,
    is_available            BOOLEAN NOT NULL DEFAULT TRUE,
    hourly_rate             NUMERIC(10,2),
    preferred_radius_km     DOUBLE PRECISION DEFAULT 10.0,
    current_location        geometry(Point,4326),
    resume_score            DOUBLE PRECISION,
    ats_score               DOUBLE PRECISION,
    is_deleted              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_worker_profile_user ON worker_profiles(user_id);
CREATE INDEX idx_worker_profile_location ON worker_profiles USING GIST (current_location);

CREATE TABLE worker_skills (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id               UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    skill_name              VARCHAR(255) NOT NULL,
    proficiency_level       VARCHAR(20) NOT NULL DEFAULT 'BEGINNER',
    years_of_experience     INT,
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_worker_skill_worker ON worker_skills(worker_id);

CREATE TABLE worker_experiences (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id       UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    job_title       VARCHAR(255) NOT NULL,
    company_name    VARCHAR(255) NOT NULL,
    start_date      DATE,
    end_date        DATE,
    is_current      BOOLEAN NOT NULL DEFAULT FALSE,
    description     TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_worker_exp_worker ON worker_experiences(worker_id);

CREATE TABLE worker_education (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id       UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    institution     VARCHAR(255) NOT NULL,
    degree          VARCHAR(255),
    field_of_study  VARCHAR(255),
    start_date      DATE,
    end_date        DATE,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_worker_edu_worker ON worker_education(worker_id);

CREATE TABLE certificates (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id               UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    title                   VARCHAR(255) NOT NULL,
    issuing_organization    VARCHAR(255),
    issue_date              DATE,
    expiry_date             DATE,
    credential_url          TEXT,
    file_url                TEXT,
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_certificate_worker ON certificates(worker_id);

CREATE TABLE portfolio_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id       UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    media_url       TEXT,
    project_url     TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_portfolio_worker ON portfolio_items(worker_id);

-- =========================================================================
-- EMPLOYERS
-- =========================================================================

CREATE TABLE employers (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name               VARCHAR(255) NOT NULL,
    business_type               VARCHAR(100),
    description                 TEXT,
    gstin                       VARCHAR(50),
    business_address            TEXT,
    location                    geometry(Point,4326),
    verification_status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verification_document_url   TEXT,
    average_rating              DOUBLE PRECISION DEFAULT 0.0,
    total_ratings               INT DEFAULT 0,
    is_deleted                  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_employer_user ON employers(user_id);
CREATE INDEX idx_employer_location ON employers USING GIST (location);

CREATE TABLE hiring_pipeline_stages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id  UUID NOT NULL,
    stage           VARCHAR(20) NOT NULL DEFAULT 'APPLIED',
    notes           TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pipeline_application ON hiring_pipeline_stages(application_id);

CREATE TABLE interview_schedules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id  UUID NOT NULL,
    scheduled_at    TIMESTAMPTZ NOT NULL,
    mode            VARCHAR(20) DEFAULT 'IN_PERSON',
    location        TEXT,
    meeting_link    TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    notes           TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_interview_application ON interview_schedules(application_id);
