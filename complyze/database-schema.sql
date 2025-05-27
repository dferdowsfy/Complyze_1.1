-- Complyze Database Schema
-- Run this in your Supabase SQL editor to create the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt logs table
CREATE TABLE IF NOT EXISTS public.prompt_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  original_prompt TEXT NOT NULL,
  redacted_prompt TEXT,
  optimized_prompt TEXT,
  platform TEXT,
  url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'approved', 'flagged', 'blocked')),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 100),
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  redaction_details JSONB DEFAULT '[]',
  mapped_controls JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scored_at TIMESTAMP WITH TIME ZONE
);

-- Governance settings table
CREATE TABLE IF NOT EXISTS public.governance_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  framework_mode TEXT DEFAULT 'NIST' CHECK (framework_mode IN ('NIST', 'OWASP', 'ISO', 'HIPAA', 'SOC2')),
  top_blocked_categories JSONB DEFAULT '[]',
  redaction_enabled BOOLEAN DEFAULT true,
  pii_block_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompt_logs_user_id ON public.prompt_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_logs_project_id ON public.prompt_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_prompt_logs_status ON public.prompt_logs(status);
CREATE INDEX IF NOT EXISTS idx_prompt_logs_risk_level ON public.prompt_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_prompt_logs_created_at ON public.prompt_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_logs_updated_at BEFORE UPDATE ON public.prompt_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_governance_settings_updated_at BEFORE UPDATE ON public.governance_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Prompt logs policies
CREATE POLICY "Users can view own prompt logs" ON public.prompt_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create prompt logs" ON public.prompt_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompt logs" ON public.prompt_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- Governance settings policies
CREATE POLICY "Users can view own governance settings" ON public.governance_settings
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id));

CREATE POLICY "Users can create governance settings" ON public.governance_settings
    FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id));

CREATE POLICY "Users can update own governance settings" ON public.governance_settings
    FOR UPDATE USING (auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Create a default project for the new user
  INSERT INTO public.projects (name, description, user_id)
  VALUES ('Default Project', 'Your default Complyze project', NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample data for testing (optional)
-- You can remove this section if you don't want sample data

-- Sample user (this will be created automatically when someone signs up)
-- Sample project and prompt logs will be created through the application 