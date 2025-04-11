import { int, real, sqliteTable, text, } from "drizzle-orm/sqlite-core";

export const categoriesTable = sqliteTable('categories', {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
});

export const expensesTable = sqliteTable('expenses', {
    id: int().primaryKey({ autoIncrement: true }),
    amount: real().notNull(),
    date: text().notNull(),
    description: text(),
    categoryId: int().notNull().references(() => categoriesTable.id),
});

export const budgetsTable = sqliteTable('budgets', {
    id: int().primaryKey({ autoIncrement: true }),
    month: int().notNull(),
    year: int().notNull(),
    amount: real().notNull(),
})

export const transactionTypesTable = sqliteTable('transaction_types', {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
});

export const transactionsTable = sqliteTable('transactions', {
    id: int().primaryKey({ autoIncrement: true }),
    typeId: int().notNull().references(() => transactionTypesTable.id),
    amount: real().notNull(),
    date: text().notNull(),
    description: text(),
    categoryId: int().references(() => categoriesTable.id),
});

export const schema = {
    budgets: budgetsTable,
    categories: categoriesTable,
    expenses: expensesTable,
    transactionTypesTable,
    transactions: transactionsTable,
};
