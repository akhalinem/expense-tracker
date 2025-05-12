INSERT INTO transaction_types (name) VALUES ('income');

INSERT INTO transactions (typeId, amount, date, description, categoryId)
SELECT 
    (SELECT id FROM transaction_types WHERE name = 'income') AS typeId,
    amount,
    (year || '-' || CASE WHEN month < 10 THEN '0' || month ELSE month END || '-01 00:00:00') AS date,
    'Budget for ' || CASE 
        WHEN month = 1 THEN 'January'
        WHEN month = 2 THEN 'February'
        WHEN month = 3 THEN 'March'
        WHEN month = 4 THEN 'April'
        WHEN month = 5 THEN 'May'
        WHEN month = 6 THEN 'June'
        WHEN month = 7 THEN 'July'
        WHEN month = 8 THEN 'August'
        WHEN month = 9 THEN 'September'
        WHEN month = 10 THEN 'October'
        WHEN month = 11 THEN 'November'
        WHEN month = 12 THEN 'December'
    END || ' ' || year AS description,
    NULL AS categoryId
FROM budgets;