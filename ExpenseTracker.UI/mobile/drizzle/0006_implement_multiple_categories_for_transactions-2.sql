-- Custom SQL migration file, put your code below! --

-- This migration file is used to implement multiple categories for transactions
-- by creating a new table to store the many-to-many relationship between transactions and categories.
-- It also includes the necessary foreign key constraints to ensure data integrity.
-- The new table is named 'transaction_categories' and it contains two foreign keys:
-- 1. transactionId: References the id of the transaction in the transactions table.
-- 2. categoryId: References the id of the category in the categories table.
-- The combination of these two foreign keys creates a unique constraint to prevent duplicate entries
-- for the same transaction-category pair.
-- This script is meant to be run in a SQLite database.

CREATE TABLE transaction_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    transactionId INTEGER NOT NULL,
    categoryId INTEGER NOT NULL,
    FOREIGN KEY (transactionId) REFERENCES transactions(id),
    FOREIGN KEY (categoryId) REFERENCES categories(id),
    UNIQUE (transactionId, categoryId)
);

-- migrate existing data from the old approach (single category per transaction)
-- to the new approach (multiple categories per transaction)

-- Note: Make sure the table name below matches your actual schema
-- Check if you're using 'expenses' or 'transactions' as the table name
INSERT INTO transaction_categories (transactionId, categoryId)
SELECT id, categoryId
FROM transactions
WHERE categoryId IS NOT NULL;

-- SQLite doesn't support DROP COLUMN directly, so we need to use a workaround:
-- 1. Create a new table without the categoryId column
-- 2. Copy data from the old table
-- 3. Drop the old table
-- 4. Rename the new table to the original name

-- Create a new table without the categoryId column
CREATE TABLE transactions_new (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`typeId` integer NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`description` text,
	FOREIGN KEY (`typeId`) REFERENCES `transaction_types`(`id`) ON UPDATE no action ON DELETE no action
);

-- Copy data from the old table
INSERT INTO transactions_new
SELECT id, typeId, amount, date, description
FROM transactions;

-- Drop the old table
DROP TABLE transactions;

-- Rename the new table
ALTER TABLE transactions_new RENAME TO transactions;

-- Recreate any indices that were on the old table
-- Example:
-- CREATE INDEX idx_transactions_date ON transactions(date);