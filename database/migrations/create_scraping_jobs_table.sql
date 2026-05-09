-- Create scraping_jobs table for managing creator scraping tasks
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  display_name VARCHAR(255),
  provided_followers_count INTEGER,
  provided_engagement_rate DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  scraped_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_list_user ON scraping_jobs(list_id, user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_username_platform ON scraping_jobs(username, platform);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at ON scraping_jobs(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own scraping jobs" ON scraping_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scraping jobs" ON scraping_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scraping jobs" ON scraping_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scraping_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_scraping_jobs_updated_at
  BEFORE UPDATE ON scraping_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_scraping_jobs_updated_at();

-- Comments for documentation
COMMENT ON TABLE scraping_jobs IS 'Queue for managing creator scraping tasks';
COMMENT ON COLUMN scraping_jobs.status IS 'Current status of the scraping job';
COMMENT ON COLUMN scraping_jobs.attempts IS 'Number of scraping attempts made';
COMMENT ON COLUMN scraping_jobs.scraped_data IS 'JSON data retrieved from scraping';
COMMENT ON COLUMN scraping_jobs.provided_followers_count IS 'Follower count provided in CSV (if any)';
COMMENT ON COLUMN scraping_jobs.provided_engagement_rate IS 'Engagement rate provided in CSV (if any)';
