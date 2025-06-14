import { int, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const categoriesTable = sqliteTable('categories', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  color: text().notNull(),
});

export const transactionTypesTable = sqliteTable('transaction_types', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
});

export const transactionsTable = sqliteTable('transactions', {
  id: int().primaryKey({ autoIncrement: true }),
  typeId: int()
    .notNull()
    .references(() => transactionTypesTable.id),
  amount: real().notNull(),
  date: text().notNull(),
  description: text(),
});

export const transactionCategoriesTable = sqliteTable(
  'transaction_categories',
  {
    id: int().primaryKey({ autoIncrement: true }),
    transactionId: int()
      .notNull()
      .references(() => transactionsTable.id),
    categoryId: int()
      .notNull()
      .references(() => categoriesTable.id),
  }
);

export const voiceRecordingsTable = sqliteTable('voice_recordings', {
  id: int().primaryKey({ autoIncrement: true }),
  filePath: text().notNull(),
  fileName: text().notNull(),
  duration: real(), // duration in seconds
  recordedAt: text().notNull(), // ISO date string
  fileSize: int(), // file size in bytes
});

export const schema = {
  categories: categoriesTable,
  transactionTypes: transactionTypesTable,
  transactions: transactionsTable,
  transactionCategories: transactionCategoriesTable,
  voiceRecordings: voiceRecordingsTable,
};
