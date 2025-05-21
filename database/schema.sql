-- Email Buddy Database Schema for NeonDB (PostgreSQL)

-- Users table to store user information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    gmail_token TEXT,
    gmail_refresh_token TEXT,
    gmail_token_expiry TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}'::JSONB
);

-- Email templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email snippets
CREATE TABLE email_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cached emails (for offline access and faster loading)
CREATE TABLE cached_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email_id VARCHAR(255) NOT NULL, -- Original email ID from provider (e.g., Gmail)
    thread_id VARCHAR(255),
    subject VARCHAR(255),
    sender VARCHAR(255),
    recipients JSONB, -- Store to, cc, bcc as JSON
    preview TEXT,
    body TEXT,
    date TIMESTAMP WITH TIME ZONE,
    read BOOLEAN DEFAULT FALSE,
    starred BOOLEAN DEFAULT FALSE,
    category VARCHAR(50), -- primary, social, promotions, etc.
    labels JSONB, -- Store labels/folders as JSON array
    attachments JSONB, -- Store attachment metadata as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, email_id)
);

-- Offline emails (emails created while offline)
CREATE TABLE offline_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_recipients JSONB NOT NULL, -- Array of email addresses
    cc_recipients JSONB,
    bcc_recipients JSONB,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL, -- pending, sent, draft
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Follow-ups
CREATE TABLE follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email_id VARCHAR(255), -- Can be null for manually created follow-ups
    subject VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    status VARCHAR(20) NOT NULL, -- pending, completed, snoozed
    priority VARCHAR(20) NOT NULL, -- high, medium, low
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled emails
CREATE TABLE scheduled_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_recipients JSONB NOT NULL, -- Array of email addresses
    cc_recipients JSONB,
    bcc_recipients JSONB,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL, -- scheduled, sent, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email tracking
CREATE TABLE tracked_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email_id VARCHAR(255), -- Original email ID if sent through a provider
    subject VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL, -- sent, delivered, read, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Link clicks in tracked emails
CREATE TABLE tracked_email_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_email_id UUID REFERENCES tracked_emails(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    clicked_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI analysis cache
CREATE TABLE ai_analysis_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email_id VARCHAR(255) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL, -- summary, sentiment, reply_suggestions, etc.
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, email_id, analysis_type)
);

-- Indexes for performance
CREATE INDEX idx_cached_emails_user_id ON cached_emails(user_id);
CREATE INDEX idx_cached_emails_date ON cached_emails(date);
CREATE INDEX idx_follow_ups_user_id ON follow_ups(user_id);
CREATE INDEX idx_follow_ups_due_date ON follow_ups(due_date);
CREATE INDEX idx_scheduled_emails_user_id ON scheduled_emails(user_id);
CREATE INDEX idx_scheduled_emails_scheduled_time ON scheduled_emails(scheduled_time);
CREATE INDEX idx_tracked_emails_user_id ON tracked_emails(user_id);
CREATE INDEX idx_ai_analysis_cache_user_id_email_id ON ai_analysis_cache(user_id, email_id);
