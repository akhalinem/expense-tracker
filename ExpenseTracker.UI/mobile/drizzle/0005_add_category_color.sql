-- Custom SQL migration file, put your code below! --

-- add color column to categories table and set default value to #FFFFFF1A
ALTER TABLE categories
ADD COLUMN color TEXT DEFAULT '#FFFFFF1A';

-- update existing categories to have a default color
UPDATE categories
SET color = '#FFFFFF1A'
WHERE color IS NULL;