-- Custom SQL migration file, put your code below! --

-- add color column to categories table and set default value to #000000
ALTER TABLE categories
ADD COLUMN color TEXT DEFAULT '#000000';

-- update existing categories to have a default color
UPDATE categories
SET color = '#000000'
WHERE color IS NULL;