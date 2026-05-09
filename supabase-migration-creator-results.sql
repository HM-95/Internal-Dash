-- Create table for storing creator results linked to chat sessions
CREATE TABLE IF NOT EXISTS chat_creator_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  prompt_hash TEXT NOT NULL,
  prompt TEXT NOT NULL,
  creators_data JSONB NOT NULL, -- Store the full creator results as JSON
  total_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_creator_results_session_id ON chat_creator_results(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_creator_results_prompt_hash ON chat_creator_results(prompt_hash);

-- Add RLS policies
ALTER TABLE chat_creator_results ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own creator results
CREATE POLICY "Users can view their own creator results" ON chat_creator_results
  FOR SELECT USING (
    chat_session_id IN (
      SELECT id FROM chat_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to insert their own creator results
CREATE POLICY "Users can insert their own creator results" ON chat_creator_results
  FOR INSERT WITH CHECK (
    chat_session_id IN (
      SELECT id FROM chat_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to update their own creator results
CREATE POLICY "Users can update their own creator results" ON chat_creator_results
  FOR UPDATE USING (
    chat_session_id IN (
      SELECT id FROM chat_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to delete their own creator results
CREATE POLICY "Users can delete their own creator results" ON chat_creator_results
  FOR DELETE USING (
    chat_session_id IN (
      SELECT id FROM chat_sessions 
      WHERE user_id = auth.uid()
    )
  ); 