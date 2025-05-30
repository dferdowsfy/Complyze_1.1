-- Manual SQL to create RedactionSettings table
-- Copy and paste this into Supabase SQL Editor and run it

-- Create the RedactionSettings table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_redaction_settings_user_id ON public."RedactionSettings"(user_id);
CREATE INDEX IF NOT EXISTS idx_redaction_settings_item_key ON public."RedactionSettings"(item_key);

-- Insert some sample data for testing
INSERT INTO public."RedactionSettings" (user_id, item_key, enabled) VALUES
    ('user_123', 'PII.Email', true),
    ('user_123', 'PII.Phone Number', true),
    ('user_123', 'PII.SSN', true),
    ('user_123', 'PII.Name', false),
    ('user_123', 'Credentials & Secrets.API Keys', true),
    ('user_123', 'Credentials & Secrets.OAuth Tokens', true),
    ('user_123', 'Jailbreak Patterns.Ignore previous instructions', true)
ON CONFLICT (user_id, item_key) DO NOTHING;

-- Verify the table was created
SELECT COUNT(*) as total_settings FROM public."RedactionSettings";
SELECT * FROM public."RedactionSettings" WHERE user_id = 'user_123' LIMIT 5; 