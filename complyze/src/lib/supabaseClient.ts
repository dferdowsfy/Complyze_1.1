import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://likskioavtpnskrfxbqa.supabase.co";
// WARNING: Service role key should be in an environment variable for security.
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa3NraW9hdnRwbnNrcmZ4YnFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjY5MiwiZXhwIjoyMDYyODk4NjkyfQ.O_qkgrEHKI5QOG9UidDtieEb-kEzu-3su9Ge2XdXPSw";

if (!supabaseUrl) {
  throw new Error("Supabase URL is required.");
}
if (!supabaseServiceRoleKey) {
  throw new Error("Supabase Service Role Key is required for server-side operations.");
}

// Create a single supabase client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // It's good practice to explicitly disable auto-refreshing tokens for server-side clients
    // if you are not using user-based authentication directly with this client.
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// You might also want to export the anon key if you plan to use it on the client-side elsewhere,
// but for these API routes, the service role key is appropriate.
// const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa3NraW9hdnRwbnNrcmZ4YnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI2OTIsImV4cCI6MjA2Mjg5ODY5Mn0.vRzRh_wotQ1UFVk3fVOlAhU8bWucx4oOwkQA6939jtg"; 