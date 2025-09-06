-- Create sync_jobs table for background job processing
CREATE TABLE sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- 'upload', 'download', 'full_sync'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    progress INTEGER DEFAULT 0, -- Progress percentage (0-100)
    total_items INTEGER DEFAULT 0, -- Total items to process
    processed_items INTEGER DEFAULT 0, -- Items processed so far
    payload JSONB, -- Store the data to be processed
    results JSONB, -- Store the processing results
    error_message TEXT, -- Store error details if failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_sync_jobs_user_id ON sync_jobs(user_id);
CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_sync_jobs_created_at ON sync_jobs(created_at);
CREATE INDEX idx_sync_jobs_user_status ON sync_jobs(user_id, status);

-- Create RLS policies
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sync jobs
CREATE POLICY "Users can view their own sync jobs" ON sync_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync jobs" ON sync_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync jobs" ON sync_jobs
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sync_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_sync_jobs_updated_at
    BEFORE UPDATE ON sync_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_sync_jobs_updated_at();

-- Service role policy to allow backend to manage all sync jobs
CREATE POLICY "Service role can manage all sync jobs" ON sync_jobs
    FOR ALL USING (current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role');