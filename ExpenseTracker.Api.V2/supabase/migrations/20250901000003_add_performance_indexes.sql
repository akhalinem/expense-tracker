-- Performance optimization indexes for sync operations
-- Run this migration to dramatically improve sync query performance

-- Index for categories lookup by user_id and name (most common query)
CREATE INDEX IF NOT EXISTS idx_categories_user_name 
ON categories(user_id, name);

-- Index for categories lookup by user_id and updated_at (for sync comparison)
CREATE INDEX IF NOT EXISTS idx_categories_user_updated 
ON categories(user_id, updated_at DESC);

-- Composite index for transactions lookup by user_id, amount, date (batch sync optimization)
CREATE INDEX IF NOT EXISTS idx_transactions_user_sync_lookup 
ON transactions(user_id, amount, date, type);

-- Index for transactions by user_id and updated_at (for sync comparison)
CREATE INDEX IF NOT EXISTS idx_transactions_user_updated 
ON transactions(user_id, updated_at DESC);

-- Index for transaction_categories by transaction_id (for category sync)
CREATE INDEX IF NOT EXISTS idx_transaction_categories_transaction 
ON transaction_categories(transaction_id);

-- Index for sync_jobs by user_id and status (for job queries)
CREATE INDEX IF NOT EXISTS idx_sync_jobs_user_status 
ON sync_jobs(user_id, status);

-- Index for sync_jobs by status and created_at (for job processing)
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status_created 
ON sync_jobs(status, created_at ASC) WHERE status = 'pending';

-- Index for sync_jobs by user_id and created_at (for job history)
CREATE INDEX IF NOT EXISTS idx_sync_jobs_user_created 
ON sync_jobs(user_id, created_at DESC);

-- Performance statistics table for monitoring
CREATE TABLE IF NOT EXISTS sync_performance_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL, -- 'category_sync', 'transaction_sync', 'full_sync'
  item_count INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  created_items INTEGER DEFAULT 0,
  updated_items INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance stats queries
CREATE INDEX IF NOT EXISTS idx_sync_performance_user_created 
ON sync_performance_stats(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_performance_operation_created 
ON sync_performance_stats(operation_type, created_at DESC);

-- RLS policies for performance stats
ALTER TABLE sync_performance_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_performance_stats" ON sync_performance_stats
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "service_role_manage_performance_stats" ON sync_performance_stats
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL PRIVILEGES ON sync_performance_stats TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify indexes are created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('categories', 'transactions', 'transaction_categories', 'sync_jobs')
ORDER BY tablename, indexname;