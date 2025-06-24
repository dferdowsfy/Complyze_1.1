-- Add role column to users table for admin access control
-- Run this in your Supabase SQL Editor

-- Add role column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));

-- Update existing users to have 'user' role by default
UPDATE public.users 
SET role = 'user' 
WHERE role IS NULL;

-- Create index for better performance on role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Make yourself an admin (replace with your actual user ID)
-- You can find your user ID by logging into the dashboard and checking the browser console
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';

-- Example: Make a specific user admin by email
-- UPDATE public.users SET role = 'admin' WHERE email = 'dferdows@gmail.com';

-- View current users and their roles
SELECT id, email, full_name, plan, role, created_at 
FROM public.users 
ORDER BY created_at DESC; 