-- Internal Access Control System Migration
-- This migration creates tables for internal-only access control

-- Create internal_users table
CREATE TABLE IF NOT EXISTS public.internal_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  access_group VARCHAR(20) NOT NULL CHECK (access_group IN ('code_access', 'non_code_access', 'guest_access')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create internal_access_logs table
CREATE TABLE IF NOT EXISTS public.internal_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'login_attempt', 'login_success', 'login_failed', 'logout'
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_internal_users_username ON public.internal_users(username);
CREATE INDEX IF NOT EXISTS idx_internal_users_access_group ON public.internal_users(access_group);
CREATE INDEX IF NOT EXISTS idx_access_logs_username ON public.internal_access_logs(username);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.internal_access_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.internal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_access_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for internal_users (only service role can access)
DROP POLICY IF EXISTS "Service role can manage internal users" ON public.internal_users;
CREATE POLICY "Service role can manage internal users" ON public.internal_users
  FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for access logs (only service role can access)
DROP POLICY IF EXISTS "Service role can manage access logs" ON public.internal_access_logs;
CREATE POLICY "Service role can manage access logs" ON public.internal_access_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Insert initial users (passwords will be hashed by the application)
-- Note: These are placeholder values - actual hashed passwords will be inserted by the application
INSERT INTO public.internal_users (username, password_hash, access_group) VALUES
  ('hari_m', 'PLACEHOLDER_HASH', 'code_access'),
  ('odin_l', 'PLACEHOLDER_HASH', 'code_access'),
  ('avik_r', 'PLACEHOLDER_HASH', 'code_access'),
  ('member_haven', 'PLACEHOLDER_HASH', 'non_code_access')
ON CONFLICT (username) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for internal_users
DROP TRIGGER IF EXISTS update_internal_users_updated_at ON public.internal_users;
CREATE TRIGGER update_internal_users_updated_at
    BEFORE UPDATE ON public.internal_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
