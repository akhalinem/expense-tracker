import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export const incomesTable = sqliteTable('incomes', {
    id: int().primaryKey({ autoIncrement: true }),
    amount: real().notNull(),
    date: text().notNull(),
    description: text(),
});

export const schema = {
    budgets: budgetsTable,
    categories: categoriesTable,
    expenses: expensesTable,
    incomes: incomesTable,
};
