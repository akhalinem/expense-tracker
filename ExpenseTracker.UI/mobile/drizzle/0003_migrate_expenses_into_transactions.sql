INSERT INTO transaction_types (name) VALUES ('expense');

INSERT INTO transactions (typeId, amount, date, description, categoryId)
SELECT 
    (SELECT id FROM transaction_types WHERE name = 'expense') AS typeId,
    amount,
    date,
    description,
    categoryId
FROM expenses