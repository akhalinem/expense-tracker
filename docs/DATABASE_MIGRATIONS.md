# Database Migrations Guide

This document outlines all database migrations for the ExpenseTracker project, including both local SQLite and Supabase cloud database changes.

## Overview

The expense tracker uses a dual-database approach:

- **Local SQLite**: Stores offline data on mobile devices
- **Supabase PostgreSQL**: Cloud database for sync and backup

## Migration Management

### Supabase Migrations

Migrations are managed through the Supabase CLI and stored in `ExpenseTracker.Api.V2/supabase/migrations/`.

#### Migration Structure

```
supabase/migrations/
├── 20240301000000_initial_schema.sql
├── 20240315000000_add_sync_jobs.sql
├── 20240318000000_add_performance_stats.sql
└── 20240320000000_optimize_indexes.sql
```

### Available Migrations

#### 1. Initial Schema (`20240301000000_initial_schema.sql`)

Creates the core tables for expenses, categories, and budgets.

```sql
-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#007AFF',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  period VARCHAR(20) NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. Sync Jobs Table (`20240315000000_add_sync_jobs.sql`)

Adds background job processing for sync operations.

```sql
-- Create sync_jobs table for background processing
CREATE TABLE sync_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX idx_sync_jobs_user_id ON sync_jobs(user_id);
CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_sync_jobs_created_at ON sync_jobs(created_at);

-- Add RLS policies
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync jobs" ON sync_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync jobs" ON sync_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync jobs" ON sync_jobs
  FOR UPDATE USING (auth.uid() = user_id);
```

#### 3. Performance Statistics (`20240318000000_add_performance_stats.sql`)

Adds tables for tracking sync performance and statistics.

```sql
-- Create performance_stats table
CREATE TABLE performance_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL,
  duration_ms INTEGER NOT NULL,
  records_processed INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance queries
CREATE INDEX idx_performance_stats_user_id ON performance_stats(user_id);
CREATE INDEX idx_performance_stats_operation_type ON performance_stats(operation_type);
CREATE INDEX idx_performance_stats_created_at ON performance_stats(created_at);

-- Add RLS policies
ALTER TABLE performance_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own performance stats" ON performance_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert performance stats" ON performance_stats
  FOR INSERT WITH CHECK (true);
```

#### 4. Index Optimization (`20240320000000_optimize_indexes.sql`)

Adds performance indexes for common queries.

```sql
-- Optimize expenses queries
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_expenses_category_date ON expenses(category_id, date DESC);
CREATE INDEX idx_expenses_amount ON expenses(amount);

-- Optimize categories queries
CREATE INDEX idx_categories_user_name ON categories(user_id, name);

-- Optimize budgets queries
CREATE INDEX idx_budgets_user_category ON budgets(user_id, category_id);
CREATE INDEX idx_budgets_period ON budgets(period, start_date, end_date);

-- Add composite indexes for sync operations
CREATE INDEX idx_expenses_sync ON expenses(user_id, updated_at);
CREATE INDEX idx_categories_sync ON categories(user_id, updated_at);
CREATE INDEX idx_budgets_sync ON budgets(user_id, updated_at);
```

### Row Level Security (RLS) Policies

All tables use RLS to ensure data isolation between users:

```sql
-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for expenses and budgets...
```

### Local SQLite Schema

The mobile app uses SQLite with a schema that mirrors the cloud database:

```sql
-- Categories table
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#007AFF',
  created_at TEXT,
  updated_at TEXT
);

-- Expenses table
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  category_id TEXT,
  date TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Budgets table
CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  amount REAL NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly',
  start_date TEXT NOT NULL,
  end_date TEXT,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

## Migration Commands

### Supabase CLI Commands

```bash
# Generate a new migration
supabase migration new add_new_feature

# Apply migrations to local dev
supabase db reset

# Apply migrations to remote
supabase db push

# Check migration status
supabase migration list

# Squash migrations (use carefully)
supabase migration squash
```

### Local Development

```bash
# Reset local database
cd ExpenseTracker.Api.V2
supabase db reset

# Seed with test data
npm run db:seed

# Check database status
supabase status
```

## Migration Best Practices

### 1. Always Use Transactions

```sql
BEGIN;
-- Migration statements here
COMMIT;
```

### 2. Add Indexes After Data

```sql
-- Add data first
INSERT INTO table_name ...;

-- Then add indexes
CREATE INDEX idx_name ON table_name(column);
```

### 3. Handle RLS Carefully

```sql
-- Always enable RLS for new tables
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Add appropriate policies
CREATE POLICY "policy_name" ON new_table
  FOR SELECT USING (auth.uid() = user_id);
```

### 4. Backwards Compatibility

- Never drop columns in production
- Use `ALTER TABLE ADD COLUMN` with defaults
- Deprecate features before removing them

### 5. Performance Considerations

- Add indexes for common query patterns
- Use partial indexes when appropriate
- Monitor query performance after migrations

## Rollback Procedures

### Emergency Rollback

```bash
# Rollback to specific migration
supabase db reset --version 20250901000000

# Restore from backup
supabase db restore --backup-id <backup-id>
```

### Manual Rollback

Create reverse migrations for each change:

```sql
-- Example rollback for adding a column
ALTER TABLE table_name DROP COLUMN new_column;
```

## Testing Migrations

### Local Testing

1. Apply migration to local dev database
2. Run full test suite
3. Test sync operations
4. Verify RLS policies

### Staging Testing

1. Deploy to staging environment
2. Test with production-like data
3. Verify performance impact
4. Test rollback procedures

## Monitoring

### Performance Monitoring

- Query execution times
- Index usage statistics
- Migration duration
- Lock conflicts

### Data Integrity

- Foreign key constraints
- RLS policy effectiveness
- Data consistency checks
- Sync operation success rates

## Troubleshooting

### Common Issues

#### 1. RLS Policy Conflicts

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- Debug policy failures
SET log_statement = 'all';
```

#### 2. Index Performance

```sql
-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE relname = 'table_name';

-- Analyze query plans
EXPLAIN ANALYZE SELECT ...;
```

#### 3. Migration Timeouts

- Break large migrations into smaller chunks
- Use `SET statement_timeout = 0;` for long operations
- Consider maintenance windows for major changes

### Recovery Procedures

#### 1. Failed Migration

```bash
# Check migration status
supabase migration list

# Fix issues and retry
supabase db push
```

#### 2. Data Corruption

```bash
# Restore from backup
supabase db restore --backup-id <latest-backup>

# Re-apply migrations if needed
supabase db push
```

## Future Migrations

### Planned Features

- User preferences table
- Expense attachments/receipts
- Multi-currency support
- Advanced reporting tables
- Notification preferences

### Performance Improvements

- Partitioning for large tables
- Materialized views for reporting
- Archive tables for old data
- Optimized indexes based on usage patterns
