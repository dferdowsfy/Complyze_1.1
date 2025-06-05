-- Create prompt_events table for real-time prompt tracking
CREATE TABLE IF NOT EXISTS public.prompt_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    original_prompt TEXT NOT NULL,
    optimized_prompt TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    risk_level VARCHAR(20) DEFAULT 'low',
    sensitivity_score INTEGER DEFAULT 0,
    framework_flags TEXT[] DEFAULT '{}',
    llm_used VARCHAR(50),
    platform VARCHAR(50),
    url TEXT,
    flagged BOOLEAN DEFAULT false,
    pii_detected TEXT[] DEFAULT '{}',
    compliance_frameworks TEXT[] DEFAULT '{}',
    ai_risk_indicators TEXT[] DEFAULT '{}',
    improvements JSONB DEFAULT '[]',
    -- Cost tracking fields
    original_tokens INTEGER DEFAULT 0,
    optimized_tokens INTEGER DEFAULT 0,
    tokens_saved INTEGER DEFAULT 0,
    original_cost DECIMAL(10, 6) DEFAULT 0,
    optimized_cost DECIMAL(10, 6) DEFAULT 0,
    cost_saved DECIMAL(10, 6) DEFAULT 0,
    -- Additional metadata
    session_id VARCHAR(255),
    extension_version VARCHAR(20),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_events_user_id ON public.prompt_events(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_events_timestamp ON public.prompt_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_events_risk_level ON public.prompt_events(risk_level);
CREATE INDEX IF NOT EXISTS idx_prompt_events_flagged ON public.prompt_events(flagged);
CREATE INDEX IF NOT EXISTS idx_prompt_events_platform ON public.prompt_events(platform);

-- Enable Row Level Security
ALTER TABLE public.prompt_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own prompt events
CREATE POLICY "Users can view own prompt events" ON public.prompt_events
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert prompt events
CREATE POLICY "Service role can insert prompt events" ON public.prompt_events
    FOR INSERT WITH CHECK (true);

-- Users can update their own prompt events
CREATE POLICY "Users can update own prompt events" ON public.prompt_events
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own prompt events  
CREATE POLICY "Users can delete own prompt events" ON public.prompt_events
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_prompt_events_updated_at BEFORE UPDATE ON public.prompt_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time subscriptions for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.prompt_events;

-- Grant permissions
GRANT ALL ON public.prompt_events TO authenticated;
GRANT ALL ON public.prompt_events TO service_role;