import { Client } from 'pg';

// NeonDB connection string
const connectionString = 'postgresql://email%20db_owner:npg_OZhsxN9gViK6@ep-black-violet-a517r03c-pooler.us-east-2.aws.neon.tech/email%20db?sslmode=require';

// Create a new client
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// SQL to create all tables with IF NOT EXISTS
const robustSchemaSQL = `
-- Users table to store user information
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email snippets
CREATE TABLE IF NOT EXISTS email_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cached emails (for offline access and faster loading)
CREATE TABLE IF NOT EXISTS cached_emails (
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
CREATE TABLE IF NOT EXISTS offline_emails (
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
CREATE TABLE IF NOT EXISTS follow_ups (
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
CREATE TABLE IF NOT EXISTS scheduled_emails (
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
CREATE TABLE IF NOT EXISTS tracked_emails (
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
CREATE TABLE IF NOT EXISTS tracked_email_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_email_id UUID REFERENCES tracked_emails(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    clicked_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI analysis cache
CREATE TABLE IF NOT EXISTS ai_analysis_cache (
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
CREATE INDEX IF NOT EXISTS idx_cached_emails_user_id ON cached_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_cached_emails_date ON cached_emails(date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user_id ON follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON follow_ups(due_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user_id ON scheduled_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_time ON scheduled_emails(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_tracked_emails_user_id ON tracked_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_user_id_email_id ON ai_analysis_cache(user_id, email_id);
`;

async function setupDatabaseRobust() {
  try {
    // Connect to the database with a longer timeout
    console.log('Connecting to database...');
    await client.connect();
    
    // Set a longer statement timeout (5 minutes)
    await client.query('SET statement_timeout = 300000');
    
    console.log('Testing connection...');
    const testResult = await client.query('SELECT NOW() as current_time');
    console.log(`Connection successful! Server time: ${testResult.rows[0].current_time}`);
    
    // Check existing tables
    console.log('\nChecking existing tables:');
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    // Display existing tables
    if (tableResult.rows.length > 0) {
      tableResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    } else {
      console.log('No tables found in the database.');
    }
    
    // Create or update tables
    console.log('\nCreating or updating tables...');
    await client.query(robustSchemaSQL);
    
    // Check tables after creation
    console.log('\nVerifying tables after setup:');
    const verifyResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    // Display tables after setup
    verifyResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    console.log('\nDatabase setup completed successfully!');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    // Close the connection
    await client.end();
  }
}

// Run the setup
setupDatabaseRobust();
