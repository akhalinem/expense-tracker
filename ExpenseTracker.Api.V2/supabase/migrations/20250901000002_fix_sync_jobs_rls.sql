-- Fix RLS policies for sync_jobs table to ensure service role access
-- This migration should be run after the initial sync_jobs table creation

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage all sync jobs" ON sync_jobs;
DROP POLICY IF EXISTS "Users can view their own sync jobs" ON sync_jobs;
DROP POLICY IF EXISTS "Users can insert their own sync jobs" ON sync_jobs;
DROP POLICY IF EXISTS "Users can update their own sync jobs" ON sync_jobs;

-- Recreate policies with better service role handling
-- Service role gets full access (this should be first)
CREATE POLICY "service_role_all_access" ON sync_jobs
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can only access their own jobs
CREATE POLICY "users_select_own_jobs" ON sync_jobs
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_jobs" ON sync_jobs
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_jobs" ON sync_jobs
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Alternative approach: Grant service_role direct table access
-- This bypasses RLS entirely for service_role
GRANT ALL ON sync_jobs TO service_role;

-- Ensure service_role can access the sequence for ID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;