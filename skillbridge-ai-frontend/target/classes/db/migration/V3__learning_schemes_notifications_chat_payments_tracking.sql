-- =========================================================================
-- LEARNING
-- =========================================================================

CREATE TABLE courses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    primary_skill       VARCHAR(255) NOT NULL,
    provider_name       VARCHAR(255),
    external_url        TEXT,
    duration_hours      DOUBLE PRECISION,
    level               VARCHAR(20) NOT NULL DEFAULT 'BEGINNER',
    free                BOOLEAN NOT NULL DEFAULT TRUE,
    price               NUMERIC(10,2),
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_course_skill ON courses(primary_skill);

CREATE TABLE learning_progress (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id           UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    course_id           UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress_percent    INT NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    certificate_url     TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_progress_worker_course UNIQUE (worker_id, course_id)
);
CREATE INDEX idx_progress_worker ON learning_progress(worker_id);

CREATE TABLE learning_paths (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    course_sequence     TEXT,
    target_role         VARCHAR(255),
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE course_bookmarks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id       UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_course_bookmark UNIQUE (worker_id, course_id)
);

-- =========================================================================
-- GOVERNMENT SCHEMES
-- =========================================================================

CREATE TABLE government_schemes (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title                   VARCHAR(255) NOT NULL,
    description             TEXT NOT NULL,
    category                VARCHAR(100),
    issuing_body            VARCHAR(255),
    eligibility_criteria    TEXT,
    benefit_summary         TEXT,
    official_url            TEXT,
    active                  BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_scheme_category ON government_schemes(category);

CREATE TABLE scheme_bookmarks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id       UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    scheme_id       UUID NOT NULL REFERENCES government_schemes(id) ON DELETE CASCADE,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_scheme_bookmark UNIQUE (worker_id, scheme_id)
);

-- =========================================================================
-- RECOMMENDATIONS
-- =========================================================================

CREATE TABLE recommendations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id       UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    type            VARCHAR(30) NOT NULL,
    target_id       UUID NOT NULL,
    score           DOUBLE PRECISION NOT NULL,
    reason          TEXT,
    is_dismissed    BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_recommendation_worker ON recommendations(worker_id);
CREATE INDEX idx_recommendation_type ON recommendations(type);

-- =========================================================================
-- NOTIFICATIONS
-- =========================================================================

CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                VARCHAR(30) NOT NULL,
    title               VARCHAR(255) NOT NULL,
    body                TEXT,
    reference_id        UUID,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    sent_via_email      BOOLEAN NOT NULL DEFAULT FALSE,
    sent_via_push       BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_user ON notifications(user_id);
CREATE INDEX idx_notification_read ON notifications(is_read);

-- =========================================================================
-- CHAT
-- =========================================================================

CREATE TABLE chats (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_a_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_b_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    context_id          UUID,
    context_type        VARCHAR(30),
    last_message_at     TIMESTAMPTZ,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_participant_a ON chats(participant_a_id);
CREATE INDEX idx_chat_participant_b ON chats(participant_b_id);

CREATE TABLE messages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id     UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id           UUID NOT NULL REFERENCES users(id),
    content             TEXT NOT NULL,
    attachment_url      TEXT,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_message_conversation ON messages(conversation_id);

-- =========================================================================
-- PAYMENTS / WALLET
-- =========================================================================

CREATE TABLE wallets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance         NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency        VARCHAR(3) NOT NULL DEFAULT 'INR',
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id           UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type                VARCHAR(20) NOT NULL,
    amount              NUMERIC(12,2) NOT NULL,
    gig_id              UUID REFERENCES hourly_gigs(id) ON DELETE SET NULL,
    job_id              UUID REFERENCES jobs(id) ON DELETE SET NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    external_reference  VARCHAR(255),
    description         TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transaction_wallet ON payments(wallet_id);

-- =========================================================================
-- LIVE TRACKING
-- =========================================================================

CREATE TABLE live_locations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    location            geometry(Point,4326) NOT NULL,
    heading_degrees     DOUBLE PRECISION,
    speed_kmh           DOUBLE PRECISION,
    active_gig_id       UUID,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_live_location_user ON live_locations(user_id);
CREATE INDEX idx_live_location_geo ON live_locations USING GIST (location);

CREATE TABLE location_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gig_id          UUID REFERENCES hourly_gigs(id) ON DELETE CASCADE,
    location        geometry(Point,4326) NOT NULL,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_location_history_user ON location_history(user_id);
CREATE INDEX idx_location_history_gig ON location_history(gig_id);
