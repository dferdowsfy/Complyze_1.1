import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://likskioavtpnskrfxbqa.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa3NraW9hdnRwbnNrcmZ4YnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI2OTIsImV4cCI6MjA2Mjg5ODY5Mn0.vRzRh_wotQ1UFVk3fVOlAhU8bWucx4oOwkQA6939jtg";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa3NraW9hdnRwbnNrcmZ4YnFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjY5MiwiZXhwIjoyMDYyODk4NjkyfQ.O_qkgrEHKI5QOG9UidDtieEb-kEzu-3su9Ge2XdXPSw";

if (!supabaseUrl) {
  throw new Error("Supabase URL is required.");
}
if (!supabaseServiceRoleKey) {
  throw new Error("Supabase Service Role Key is required for server-side operations.");
}

// Create a single supabase client for server-side operations (using service role)
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // It's good practice to explicitly disable auto-refreshing tokens for server-side clients
    // if you are not using user-based authentication directly with this client.
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Create a client for client-side operations (using anon key)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database schema types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
  avatar_url?: string;
  plan?: 'free' | 'pro' | 'enterprise';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  settings?: any;
}

export interface PromptLog {
  id: string;
  user_id: string;
  project_id: string;
  original_prompt: string;
  redacted_prompt?: string;
  optimized_prompt?: string;
  platform?: string;
  url?: string;
  status: 'pending' | 'processed' | 'approved' | 'flagged' | 'blocked';
  risk_level?: 'low' | 'medium' | 'high';
  clarity_score?: number;
  quality_score?: number;
  redaction_details?: any;
  mapped_controls?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
  scored_at?: string;
}

// You might also want to export the anon key if you plan to use it on the client-side elsewhere,
// but for these API routes, the service role key is appropriate.
// const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa3NraW9hdnRwbnNrcmZ4YnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI2OTIsImV4cCI6MjA2Mjg5ODY5Mn0.vRzRh_wotQ1UFVk3fVOlAhU8bWucx4oOwkQA6939jtg"; 