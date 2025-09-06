-- Simple migration to add unique constraints for duplicate prevention
-- This eliminates the need for complex sync tracking logic!

-- Add unique constraint for transactions to prevent duplicates
-- A transaction is considered duplicate if it has the same user, amount, date, description, and type
ALTER TABLE transactions 
ADD CONSTRAINT unique_user_transaction 
UNIQUE (user_id, amount, date, COALESCE(description, ''), type);

-- Categories already have unique constraint: UNIQUE(user_id, name)
-- This is sufficient for category duplicate prevention

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_transactions_unique_lookup 
ON transactions (user_id, amount, date, description, type);

-- Add a more flexible unique constraint that allows multiple transactions with same details but different times
-- Comment: In real world, users might have legitimate duplicate transactions
-- If you want to allow true duplicates, you could add a created_at timestamp to the constraint:
-- UNIQUE (user_id, amount, date, COALESCE(description, ''), type, date_trunc('minute', created_at))

-- For now, we'll use the stricter constraint to prevent sync duplicates