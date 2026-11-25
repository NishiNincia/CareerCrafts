CREATE TABLE IF NOT EXISTS worker_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    gig_radius_km DOUBLE PRECISION NOT NULL DEFAULT 10
        CHECK (gig_radius_km BETWEEN 1 AND 100),
    latitude DOUBLE PRECISION CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((latitude IS NULL) = (longitude IS NULL))
);

CREATE TABLE IF NOT EXISTS app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('gig', 'job', 'interview', 'payment', 'scheme', 'chat_message', 'system')),
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    reference_id UUID,
    route TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS app_notifications_user_created_idx
    ON app_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS app_notifications_user_unread_idx
    ON app_notifications(user_id, created_at DESC) WHERE is_read = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS app_notifications_deduplicate_idx
    ON app_notifications(user_id, type, reference_id)
    WHERE reference_id IS NOT NULL AND type IN ('gig', 'job');

CREATE TABLE IF NOT EXISTS marketplace_gigs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    budget NUMERIC(12, 2) NOT NULL CHECK (budget > 0),
    deadline DATE NOT NULL,
    work_mode TEXT NOT NULL CHECK (work_mode IN ('online', 'on_site')),
    location_address TEXT,
    latitude DOUBLE PRECISION CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (work_mode <> 'on_site' OR (location_address IS NOT NULL AND latitude IS NOT NULL AND longitude IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS marketplace_gigs_created_idx ON marketplace_gigs(created_at DESC);

CREATE TABLE IF NOT EXISTS app_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_low UUID GENERATED ALWAYS AS (LEAST(participant_a_id, participant_b_id)) STORED,
    participant_high UUID GENERATED ALWAYS AS (GREATEST(participant_a_id, participant_b_id)) STORED,
    context_id UUID,
    context_type TEXT NOT NULL DEFAULT 'general',
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (participant_a_id <> participant_b_id),
    UNIQUE (participant_low, participant_high)
);

CREATE TABLE IF NOT EXISTS app_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES app_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 4000),
    attachment_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS app_messages_conversation_created_idx
    ON app_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS app_messages_unread_idx
    ON app_messages(conversation_id, sender_id) WHERE is_read = FALSE;
