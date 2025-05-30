-- Create RedactionSettings table for storing user redaction preferences
-- This table stores individual redaction settings for each user

CREATE TABLE IF NOT EXISTS public."RedactionSettings" (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_key TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of user_id and item_key
    UNIQUE(user_id, item_key)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_redaction_settings_user_id ON public."RedactionSettings"(user_id);
CREATE INDEX IF NOT EXISTS idx_redaction_settings_item_key ON public."RedactionSettings"(item_key);

-- Enable Row Level Security (RLS)
ALTER TABLE public."RedactionSettings" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own redaction settings
CREATE POLICY "Users can view their own redaction settings" ON public."RedactionSettings"
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own redaction settings" ON public."RedactionSettings"
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own redaction settings" ON public."RedactionSettings"
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own redaction settings" ON public."RedactionSettings"
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_redaction_settings_updated_at 
    BEFORE UPDATE ON public."RedactionSettings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default enabled settings for testing
-- This can be removed in production
INSERT INTO public."RedactionSettings" (user_id, item_key, enabled) VALUES
    ('user_123', 'PII.Email', true),
    ('user_123', 'PII.Phone Number', true),
    ('user_123', 'PII.SSN', true),
    ('user_123', 'Credentials & Secrets.API Keys', true),
    ('user_123', 'Credentials & Secrets.OAuth Tokens', true)
ON CONFLICT (user_id, item_key) DO NOTHING; 