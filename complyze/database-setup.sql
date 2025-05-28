-- Complyze Database Setup
-- Run this script in your Supabase SQL editor to set up the RedactionSettings table

-- Create RedactionSettings table
CREATE TABLE IF NOT EXISTS RedactionSettings (
  user_id TEXT NOT NULL,
  item_key TEXT NOT NULL,         -- e.g., "PII.Name", "Credentials & Secrets.API Keys"
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, item_key)
);

-- Create an index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_redaction_settings_user_id ON RedactionSettings(user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at on row updates
CREATE TRIGGER update_redaction_settings_updated_at 
    BEFORE UPDATE ON RedactionSettings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE RedactionSettings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your authentication setup)
-- This policy allows users to only access their own settings
CREATE POLICY "Users can view their own redaction settings" ON RedactionSettings
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own redaction settings" ON RedactionSettings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own redaction settings" ON RedactionSettings
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own redaction settings" ON RedactionSettings
    FOR DELETE USING (auth.uid()::text = user_id);

-- Insert some default settings for testing (optional)
-- Replace 'user_123' with an actual user ID for testing
INSERT INTO RedactionSettings (user_id, item_key, enabled) VALUES
  ('user_123', 'PII.Name', true),
  ('user_123', 'PII.Email', true),
  ('user_123', 'PII.Phone Number', true),
  ('user_123', 'Credentials & Secrets.API Keys', true),
  ('user_123', 'Credentials & Secrets.OAuth Tokens', true)
ON CONFLICT (user_id, item_key) DO NOTHING; 